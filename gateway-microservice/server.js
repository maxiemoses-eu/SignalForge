const app = require('./app');
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 SignalForge Gateway running on port ${PORT}`);
});