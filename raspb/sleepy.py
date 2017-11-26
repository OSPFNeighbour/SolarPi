
#!/usr/bin/python
import RPi.GPIO as GPIO
import os, time
GPIO.setmode(GPIO.BCM)
GPIO.setup(24, GPIO.IN)
GPIO.setup(25, GPIO.OUT)
GPIO.output(25, GPIO.HIGH)
print ("[Info] Telling Sleepy Pi we are running pin 25") 


def pin_callback(channel):
	time.sleep(1.5) 
	if GPIO.input(24):
		print ("Sleepy Pi requesting shutdown on pin 24")
		os.system("sudo shutdown -h now")


GPIO.add_event_detect(24, GPIO.RISING, callback=pin_callback, bouncetime=300)


try:  
    print "Waiting for rising edge on port 24"
    while True:
    	time.sleep(1)
except KeyboardInterrupt:  
    GPIO.cleanup()       # clean up GPIO on CTRL+C exit  
GPIO.cleanup()           # clean up GPIO on normal exit  
