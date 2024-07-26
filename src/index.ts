import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ERTool } from "./ERTool";

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const port = 3000;

const erTool = new ERTool();
console.log(erTool.erProcess);

app.get("/", (req, res) => {
  res.send("working");
});

app.post("/add_runes", (req, res) => {
  const amount = Number(req.body.amount);

  if (!amount || isNaN(amount)) throw new Error("Amount empty or NaN");

  erTool.addRunes(amount);

  res.send(true);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
