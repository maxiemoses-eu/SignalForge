package main

import (
    "github.com/gin-gonic/gin"
    "github.com/sirupsen/logrus"
)

func main() {
    log := logrus.New()
    log.Formatter = &logrus.JSONFormatter{} // Best for Jenkins/Cloud logs

    r := gin.New()
    r.Use(gin.Recovery()) // Prevent crashes from taking down the service

    r.GET("/health", func(c *gin.Context) {
        log.Info("Health check triggered for SignalForge")
        c.JSON(200, gin.H{"status": "secure"})
    })

    r.Run(":8080")
}