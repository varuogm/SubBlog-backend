require('dotenv').config();
import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/auth";
import subsRoutes from "./routes/subs";
import articlesRoutes from "./routes/articles";

import mongoose from "mongoose";
const PORT = process.env.PORT ||  8000;
import cors from "cors";
mongoose
  .connect( process.env.MONGOURI as string)
  .then(() => {
    console.log("DATABSES CONNECTED");

    const app = express();
    app.use(cors());//whateevr client can coonect to access server no CORS
    dotenv.config();
    app.use(express.json());

    app.use("/auth", authRoutes);
    app.use("/subs", subsRoutes);
    app.use("/articles", articlesRoutes);



    app.listen(PORT, () => {
      console.log(`nowd lisiteing to port ${PORT} `);
    });

  })
  .catch((error) => {
      console.log({error})
    throw new Error(error);
  });
