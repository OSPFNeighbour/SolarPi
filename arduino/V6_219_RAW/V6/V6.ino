#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_INA219.h>

Adafruit_INA219 ina219_battery;
Adafruit_INA219 ina219_solar(0x41);


LiquidCrystal_I2C lcd(0x27, 16, 2); // set the LCD address to 0x27 for a 16 chars and 2 line display


float LowBattShutdown = 11.0; //shutdown voltage
float LowBattStartup = 11.5; //shutdown voltage



int Holddown = 20; //prevent flapping of the system, wait time between exec commands


//Pins used
int Pirelay = 2;
int PiRunningPort = 4;
int PiSignalShutdownPort = 3;

unsigned long LastPowerActionMilli = -10000;

int ProcessState = 1;
//0 = Running normal, pi on
//1 = Running normal, pi off
//2 = Pi is off due to power
//3 = Pi is shutting down

void setup()
{
  lcd.init();
  //lcd.backlight();
  lcd.print("Booting...");
  pinMode(PiRunningPort, INPUT);
  pinMode(PiSignalShutdownPort, OUTPUT);
  digitalWrite(PiSignalShutdownPort, LOW);
  // Initialize the INA219.
  // By default the initialization will use the largest range (32V, 2A).  However
  // you can call a setCalibration function to change this range (see comments).
  ina219_battery.begin();
  ina219_solar.begin();

ina219_battery.setCalibration_32V_1A();
  // To use a slightly lower 32V, 1A range (higher precision on amps):
  //ina219.setCalibration_32V_1A();
  // Or to use a lower 16V, 400mA range (higher precision on volts and amps):
  //ina219.setCalibration_16V_400mA();

  LastPowerActionMilli = 0;
  pinMode(Pirelay, OUTPUT);
  Serial.begin(9600);
}


void loop()
{

  float battery_shuntvoltage = 0;
  float battery_busvoltage = 0;
  float battery_current_mA = 0;
  float battery_loadvoltage = 0;
  float Vccvoltage = readVcc() / 1000;

  battery_shuntvoltage = ina219_battery.getShuntVoltage_mV();
  battery_busvoltage = ina219_battery.getBusVoltage_V();
  battery_current_mA = ina219_battery.getCurrent_mA();
  battery_loadvoltage = battery_busvoltage + (battery_shuntvoltage / 1000);

  lcd.setCursor(0, 1);
  lcd.print(battery_loadvoltage);
  lcd.print("V ");
  lcd.print(battery_current_mA * battery_loadvoltage / 1000);
  lcd.print("W");

  Serial.print("|");
  Serial.print("S:");
  Serial.print("0");
  Serial.print("|");
  Serial.print("B:");
  Serial.print(battery_loadvoltage);
  Serial.print("|");
  Serial.print("R:");
  Serial.print(Vccvoltage);
  Serial.print("|");
  Serial.print("W:");
  Serial.print(battery_current_mA * battery_loadvoltage);
  Serial.print("|");
  Serial.println("");
  unsigned long mils = millis();
  if (mils - LastPowerActionMilli >= (Holddown * 1000))
  {
    switch (ProcessState) {
      //0 = Running normal, pi on
      //1 = Running normal, pi off
      //2 = Pi is off due to power low
      //3 = Pi is shutting down
      case 0:
        lcd.setCursor(0, 0);
        if (digitalRead(PiRunningPort) == HIGH)
        {
          lcd.print(" PI IS RUNNING! ");
        } else {
          lcd.print("PI IS NO RUNING!");
        }
        if (battery_loadvoltage < LowBattShutdown) //voltage is LOW
        {
          lcd.setCursor(0, 0);
          lcd.print("SHUTTING DOWN PI");
          // //Serial.println("Shutting down the Pi");
          digitalWrite(PiSignalShutdownPort, HIGH);    // Signal the pi to shutdown
          ProcessState = 3;
          LastPowerActionMilli = millis();
        }
        break;
      case 1:
        lcd.setCursor(0, 0);
        lcd.print(" PI POWERED OFF ");
        if (battery_loadvoltage >= LowBattStartup) //voltage is OK
        {
          lcd.setCursor(0, 0);
          lcd.print("    RUNNING     ");
          ////Serial.println("Starting up the Pi");
          digitalWrite(Pirelay, HIGH);    // Start the PI
          ProcessState = 0;
          LastPowerActionMilli = millis();
        }
        break;
      case 2:
        lcd.setCursor(0, 0);
        lcd.print(" PWR LOW PI OFF! ");
        if (LowBattStartup >= LowBattShutdown) //voltage is OK again
        {
          lcd.setCursor(0, 0);
          lcd.print("  PI START UP!  ");
          //Serial.println("Starting up the Pi");
          digitalWrite(Pirelay, HIGH);    // Start the PI
          ProcessState = 0;
          LastPowerActionMilli = millis();
        }
        break;
      case 3:
        lcd.setCursor(0, 0);
        lcd.print("PI SHUTTING DOWN");
        if (digitalRead(PiRunningPort) == LOW) //if the pi has shutdown
        {
          lcd.setCursor(0, 0);
          lcd.print("BATT LOW PI OFF");
          //Serial.println("Killing power to the Pi");
          digitalWrite(Pirelay, LOW);    // Kill power to the PI
          digitalWrite(PiSignalShutdownPort, LOW); //Low the shutdown port
          ProcessState = 2;
          LastPowerActionMilli = millis();

        }
        break;
    }
  } else {
    //Serial.println("waiting for holdown to expire");
  }

  delay(1000);
}


float readVcc() {
  // Read 1.1V reference against AVcc
  // set the reference to Vcc and the measurement to the internal 1.1V reference
#if defined(__AVR_ATmega32U4__) || defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__)
  ADMUX = _BV(REFS0) | _BV(MUX4) | _BV(MUX3) | _BV(MUX2) | _BV(MUX1);
#elif defined (__AVR_ATtiny24__) || defined(__AVR_ATtiny44__) || defined(__AVR_ATtiny84__)
  ADMUX = _BV(MUX5) | _BV(MUX0);
#elif defined (__AVR_ATtiny25__) || defined(__AVR_ATtiny45__) || defined(__AVR_ATtiny85__)
  ADMUX = _BV(MUX3) | _BV(MUX2);
#else
  ADMUX = _BV(REFS0) | _BV(MUX3) | _BV(MUX2) | _BV(MUX1);
#endif

  delay(2); // Wait for Vref to settle
  ADCSRA |= _BV(ADSC); // Start conversion
  while (bit_is_set(ADCSRA, ADSC)); // measuring

  uint8_t low  = ADCL; // must read ADCL first - it then locks ADCH
  uint8_t high = ADCH; // unlocks both  sw

  long result = (high << 8) | low;

  result = 1125300L / result; // Calculate Vcc (in mV); 1125300 = 1.1*1023*1000
  return result; // Vcc in millivolts
}
