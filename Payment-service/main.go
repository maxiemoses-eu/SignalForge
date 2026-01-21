package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func setupRouter() *gin.Engine {
	r := gin.Default()
	r.POST("/pay", func(c *gin.Context) {
		var body struct {
			Amount int `json:"amount"`
		}
		if err := c.BindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "success", "amount": body.Amount})
	})
	return r
}

func main() {
	setupRouter().Run(":5003")
}
