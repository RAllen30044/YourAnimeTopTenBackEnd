import express, { NextFunction, Request, Response } from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import { Router } from "express";
import { client } from "./PrismaClient"; // Ensure this is correctly configured
import z from "zod";
import bcrypt from "bcrypt";
import { validateRequest } from "zod-express-middleware";
import { createUnsecuredInformation, generateToken } from "./validations"; // Ensure these functions are correctly defined

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(cors());

const animeController = Router();
const authController = Router();
app.use("/anime", animeController);
app.use("/auth", authController);

app.get("/", (_req, res) => {
  res.send("<h1>Anime Top Ten</h1>");
});

const transporter = nodemailer.createTransport({
  service: "outlook",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

app.post(
  "/sendEmail",
  validateRequest({
    body: z.object({
      title1: z.string(),
      mediaType1: z.string(),
      title2: z.string(),
      mediaType2: z.string(),
      title3: z.string(),
      mediaType3: z.string(),
      title4: z.string(),
      mediaType4: z.string(),
      title5: z.string(),
      mediaType5: z.string(),
      title6: z.string(),
      mediaType6: z.string(),
    }),
  }),
  (req: Request, res: Response) => {
    const {
      title1,
      mediaType1,
      title2,
      mediaType2,
      title3,
      mediaType3,
      title4,
      mediaType4,
      title5,
      mediaType5,
      title6,
      mediaType6,
    } = req.body;

    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: "ANIME ENTRY REQUEST",
      text: `Title: ${title1}
Media Type: ${mediaType1}

Title: ${title2}
Media Type: ${mediaType2}

Title: ${title3}
Media Type: ${mediaType3}

Title: ${title4}
Media Type: ${mediaType4}

Title: ${title5}
Media Type: ${mediaType5},

Title: ${title6}
Media Type: ${mediaType6}`,
    };
    if (!mailOptions) {
      return res.status(400).json({ message: "Invalid email" });
    }
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).send("Error sending email");
      } else {
        console.log("Email sent: " + info.response);
        res.send("Email sent successfully");
      }
    });
  }
);

authController.post(
  "/login",
  validateRequest({
    body: z.object({
      userName: z.string(),
      password: z.string(),
    }),
  }),
  async (req: Request, res: Response) => {
    const { userName, password } = req.body;
    try {
      const user = await client.user.findFirst({
        where: {
          userName: userName,
        },
      });
      if (!user) {
        return res.status(404).send({ message: "User Not found" });
      }
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Invalid Credentials" });
      }

      const userInformation = createUnsecuredInformation(user);
      const token = generateToken(user);

      return res.status(200).json({ token, userInformation });
    } catch (error) {
      console.error(error);
      res.status(500).json("Internal Server Error");
    }
  }
);

animeController.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const anime = await client.anime.findMany({
      orderBy: {
        title: "asc",
      },
      where: {
        title: {
          startsWith: id,
        },
      },
    });
    res.status(200).json(anime);
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
});

animeController.get("/", async (_req: Request, res: Response) => {
  try {
    const anime = await client.anime.findMany({
      orderBy: {
        title: "asc",
      },
    });
    res.status(200).json(anime);
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
});

animeController.post(
  "/",
  validateRequest({
    body: z.object({
      title: z.string(),
      mediaType: z.string(),
      pictureUrl: z.string(),
    }),
  }),
  async (req: Request, res: Response) => {
    const { title, mediaType, pictureUrl } = req.body;
    try {
      const anime = await client.anime.create({
        data: {
          title: title,
          mediaType: mediaType,
          pictureUrl: pictureUrl,
        },
      });
      res.status(201).json(anime);
    } catch (err) {
      console.error(err);
      res.status(500).json("Internal Server Error");
    }
  }
);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`
  🚀 Server ready at: http://localhost:${PORT}
  `);
});
