import { Anime } from "@prisma/client";
import { client } from "./PrismaClient";
import { DOMParser } from "xmldom";
import { encryptPassword } from "./validations";

const clearDb = async () => {
  await client.anime.deleteMany();
  await client.user.deleteMany();
};

const seedDB = async () => {
  const separations = async () => {
    const rob = await client.user.create({
      data: {
        userName: `robharmony`,
        password: await encryptPassword(`Inhumane#001`),
      },
    });
    rob;
    const figures: string[] = "01234356789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    for (let char of figures) {
      let anime = await fetch(
        `https://cdn.animenewsnetwork.com/encyclopedia/api.xml?anime=~${char}`
      );
      let response = await anime.text();
      //
      let parser = new DOMParser();
      let data = parser.parseFromString(response, "text/xml");
      if (
        !data ||
        !data.getElementsByTagName ||
        typeof data.getElementsByTagName !== "function"
      ) {
        console.error(
          "Failed to parse XML data or getElementsByTagName method is not available."
        );
        return;
      }

      const animeElements = data.getElementsByTagName("anime");
      if (!animeElements || animeElements.length === 0) {
        console.error("No anime elements found in the XML data.");
        return;
      }

      for (let i = 0; i < animeElements.length; i++) {
        let iterator = animeElements[i];

        // Extract and process data from each anime element here
        const title: string | null = iterator.getAttribute("name");
        const mediaType: string | null = iterator.getAttribute("type");
        const infoElement = iterator.getElementsByTagName("info")[0];
        const pictureUrl: string | null = infoElement
          ? infoElement.getAttribute("src")
          : null;

        if (title && mediaType && pictureUrl) {
          const anime: Anime = await client.anime.create({
            data: {
              title: title,
              mediaType: mediaType,
              pictureUrl: pictureUrl,
            },
          });

          anime;
        } else {
          console.error("Incomplete data for anime element:", iterator);
        }
      }
    }
  };

  await separations();
};
Promise.resolve()
  .then(() => console.log("Clearing Anime from database"))
  .then(clearDb)
  .then(() => console.log("Goku is powering up"))
  .then(seedDB)
  .then(() => console.log("Anime loaded"))
  .catch(console.error);
