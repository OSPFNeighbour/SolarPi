#include <LowPower.h>

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_INA219.h>

Adafruit_INA219 ina219_battery;


LiquidCrystal_I2C lcd(0x27, 16, 2); // set the LCD address to 0x27 for a 16 chars and 2 line display


float LowBattShutdown = 11.35; //shutdown voltage
float LowBattStartup = 11.5; //shutdown voltage



int Holddown = 2; //2*8 = 16 sec - prevent flapping of the system, wait X cycles between exec commands
const int AverageOverThisMayLoops = 5; //5*8 = 40 secs

//Pins used
int Pirelay = 2;
int PiRunningPort = 4;
int PiSignalShutdownPort = 3;
int RunningLED = 9;

unsigned long LastAction = 0;

int ProcessState = 1;
//0 = Running normal, pi on
//1 = Running normal, pi off
//2 = Pi is off due to power
//3 = Pi is shutting down

float avg_battery_shuntvoltage[AverageOverThisMayLoops];
float avg_battery_busvoltage[AverageOverThisMayLoops];
float avg_battery_current_mA[AverageOverThisMayLoops];
float avg_battery_loadvoltage[AverageOverThisMayLoops];

float avg_Vccvoltage[AverageOverThisMayLoops];



int AvgPosition = 0;
int LoopCounter = 0;
void setup()
{
  lcd.init();
  lcd.backlight();
  lcd.print("Booting...");
  pinMode(PiRunningPort, INPUT);
  pinMode(PiSignalShutdownPort, OUTPUT);
  digitalWrite(PiSignalShutdownPort, LOW);
  // Initialize the INA219.
  // By default the initialization will use the largest range (32V, 2A).  However
  // you can call a setCalibration function to change this range (see comments).
  ina219_battery.begin();

  pinMode(Pirelay, OUTPUT);
  pinMode(RunningLED, OUTPUT);

  Serial.begin(9600);

  //Avg buffer warmup
  for (int i = 0; i <= AverageOverThisMayLoops; i++) {
    avg_battery_shuntvoltage[i] = ina219_battery.getShuntVoltage_mV();
    avg_battery_busvoltage[i] = ina219_battery.getBusVoltage_V();
    avg_battery_current_mA[i] = ina219_battery.getCurrent_mA();
    avg_battery_loadvoltage[i] = avg_battery_busvoltage[i] + (avg_battery_shuntvoltage[i] / 1000);

    avg_Vccvoltage[i] = readVcc() / 1000;

  }
  lcd.setCursor(0, 0);
  lcd.print("....Running!...");
  digitalWrite(RunningLED, HIGH);

}


void loop()
{

  LowPower.idle(SLEEP_4S, ADC_OFF, TIMER2_OFF, TIMER1_OFF, TIMER0_OFF,
                SPI_OFF, USART0_OFF, TWI_OFF);

  //Sample every 4 sec, print every 8

  float battery_shuntvoltage = 0;
  float battery_busvoltage = 0;
  float battery_current_mA = 0;
  float battery_loadvoltage = 0;

  float Vccvoltage = readVcc() / 1000;

  battery_shuntvoltage = ina219_battery.getShuntVoltage_mV();
  battery_busvoltage = ina219_battery.getBusVoltage_V();
  battery_current_mA = ina219_battery.getCurrent_mA();
  battery_loadvoltage = battery_busvoltage + (battery_shuntvoltage / 1000);

  avg_battery_shuntvoltage[AvgPosition] = battery_shuntvoltage;
  avg_battery_busvoltage[AvgPosition] = battery_busvoltage;
  avg_battery_current_mA[AvgPosition] = battery_current_mA;
  avg_battery_loadvoltage[AvgPosition] = battery_loadvoltage;

  avg_Vccvoltage[AvgPosition] = readVcc() / 1000;

  if (AvgPosition == AverageOverThisMayLoops - 1) {
    AvgPosition = 0;
  } else {
    AvgPosition = AvgPosition + 1;
  }

  if (LoopCounter == 1)
  {
    LoopCounter = 0;
    //  float avgtotal_battery_shuntvoltage = 0;
    //  float avgtotal_battery_busvoltage = 0;
    //  float avgtotal_battery_current_mA = 0;
    //  float avgtotal_battery_loadvoltage = 0;
    //  float avgtotal_Vccvoltage = 0;
    //  int AvgPosition = 0;

    lcd.setCursor(0, 1);
    lcd.print("BV:");
    lcd.print(battery_loadvoltage);
    lcd.print(" BW:");
    lcd.print(battery_current_mA / 1000 * battery_loadvoltage);


    Serial.print("|");
    Serial.print("B:");
    Serial.print(average(avg_battery_loadvoltage, AverageOverThisMayLoops));
    Serial.print("|");
    Serial.print("R:");
    Serial.print(average(avg_Vccvoltage, AverageOverThisMayLoops));
    Serial.print("|");
    Serial.print("W:");
    Serial.print(average(avg_battery_current_mA, AverageOverThisMayLoops) * average(avg_battery_loadvoltage, AverageOverThisMayLoops));
    Serial.println("|");

    if (LastAction >= Holddown)
    {
      LastAction = 0;
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
          if (average(avg_battery_loadvoltage, AverageOverThisMayLoops) < LowBattShutdown) //voltage is LOW
          {
            lcd.setCursor(0, 0);
            lcd.print("SHUTTING DOWN PI");
            // //Serial.println("Shutting down the Pi");
            digitalWrite(PiSignalShutdownPort, HIGH);    // Signal the pi to shutdown
            ProcessState = 3;
          }
          break;
        case 1:
          lcd.setCursor(0, 0);
          lcd.print(" PI POWERED OFF ");
          if (average(avg_battery_loadvoltage, AverageOverThisMayLoops) >= LowBattStartup) //voltage is OK
          {
            lcd.setCursor(0, 0);
            lcd.print("    RUNNING     ");
            ////Serial.println("Starting up the Pi");
            digitalWrite(Pirelay, HIGH);    // Start the PI
            ProcessState = 0;
          }
          break;
        case 2:
          lcd.setCursor(0, 0);
          lcd.print(" PWR LOW PI OFF! ");
          if (average(avg_battery_loadvoltage, AverageOverThisMayLoops) >= LowBattStartup) //voltage is OK again
          {
            lcd.setCursor(0, 0);
            lcd.print("  PI START UP!  ");
            //Serial.println("Starting up the Pi");
            digitalWrite(Pirelay, HIGH);    // Start the PI
            ProcessState = 0;
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
          }
          break;
      }
    } else {
      LastAction = LastAction + 1;
    }
  } else {
    LoopCounter++;
  }

  //sleepy time
  Serial.flush();

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

float average (float * array, int len)  // assuming array is int.
{
  float sum = 0 ;  // sum will be larger than an item, long for safety.
  for (int i = 0 ; i < len ; i++)
  {
    sum =  (float)sum + (float)array [i] ;
  }

  return  ((float) sum) / len ;  // average will be fractional, so float may be appropriate.
}
