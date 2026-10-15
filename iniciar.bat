@echo off
echo Abriendo proyecto en VS code...
cd /cd "%~dp0"
code .
exit
rem si VS no esta en la variable del entorno PATH, hay que colocar la ruta para que se ejecute.