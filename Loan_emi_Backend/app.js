import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Loan EMI Backend Running");
});

export default app;
