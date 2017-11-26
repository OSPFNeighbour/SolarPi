#!/usr/bin/python

import serial
import sqlite3 as lite
import sys
import time

while True:
    ser = serial.Serial(
        port='/dev/ttyAMA0',\
        baudrate=9600,\
        parity=serial.PARITY_NONE,\
        stopbits=serial.STOPBITS_ONE,\
        bytesize=serial.EIGHTBITS,\
            timeout=16)
   
    print("connected to: " + ser.portstr)

    #this will store the line
    line = ser.readline();
    
    results = line.split("|")
    
    try:
        con = lite.connect('/srv/solarpi.sqlite')
    
        with con:
            cur = con.cursor() 
            battvoltage = "0"
            solarvoltage = "0"
            regularvoltage = "0"
            battpower = "0"
            solarpower = "0"
            for result in results:
             if (result != "") and (result != '\r\n'):
               if result[0] == "B":
                 print("Battery: "+result.split(":")[1]+"V")
                 battvoltage = result.split(":")[1]
               elif result[0] == "S":
                 print("Solar: "+result.split(":")[1]+"V")
                 solarvoltage = result.split(":")[1]
               elif result[0] == "R":
                 print("Regulator: "+result.split(":")[1]+"V")
                 regularvoltage = result.split(":")[1]
               elif result[0] == "W":
                 print("Power: "+result.split(":")[1]+"mW")
                 battpower = result.split(":")[1]
               elif result[0] == "M":
                 print("Solar Power: "+result.split(":")[1]+"mW")
                 solarpower = result.split(":")[1]
            if battvoltage != "" and solarvoltage != "" and regularvoltage != "" and battpower != "":
               cur.execute('INSERT INTO pdu (battvoltage,solarvoltage,regularvoltage,battpower,solarpower) VALUES (?,?,?,?,?)',(battvoltage,solarvoltage,regularvoltage,battpower,solarpower)) 
               con.commit()
            ser.close()
    except lite.Error, e:
        
        if con:
            con.rollback()
            
        print "Error %s:" % e.args[0]
        sys.exit(1)
        
    finally:
        
        if con:
            con.close()
    time.sleep(30)        
