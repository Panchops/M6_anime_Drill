const express = require("express");
const handlebars = require("express-handlebars");
const fs = require("fs").promises;
const _ = require("lodash");

const app = express();
const PORT = 3000;

// Functions for fetching and handling data
let animeDatabase;

async function fetchAnimeData() {
  animeDatabase = await fs
    .readFile("./public/animeDB.json", "utf-8")
    .then((data) => JSON.parse(data))
    .catch((error) => {
      console.error("Error reading animeDB.json:", error);
      throw error;
    });

  return animeDatabase;
}

function getAnime(id) {
  if (!id) {
    return animeDatabase;
  }
  if (id.length > 1) {
    return {
      id: id,
      info: animeDatabase[_.findKey(animeDatabase, { title: _.startCase(_.toLower(id)) })],
    };
  } else {
    return { id: id, info: animeDatabase[id] };
  }
}

// Configure Express app
app.engine(
  "hbs",
  handlebars.engine({
    layoutsDir: __dirname + "/views/layouts",
    extname: "hbs",
    defaultLayout: "main",
    partialsDir: __dirname + "/views/partials",
  })
);

app.set("view engine", "hbs");
app.use("/static", express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true })); // for handling form data

// Routes
app.get("/", (req, res) => {
  res.render("landing", {
    layout: "main-layout",
    animeEntries: getAnime(),
    dataAvailable: true,
  });
});

app.get("/:id", (req, res) => {
  let id = req.params.id;
  if (!getAnime(id).info) {
    res.render("landing", {
      layout: "not-found-layout",
      dataAvailable: false,
    });
    res.status(404);
  } else {
    res.render("landing", {
      layout: "main-layout",
      animeEntries: getAnime(id),
      dataAvailable: false,
    });
  }
});

app.get("/add", (req, res) => {
  res.render("landing", {
    layout: "add-layout",
  });
});

app.get("/edit/:id", (req, res) => {
  let editId = req.params.id;
  res.render("landing", {
    layout: "edit-layout",
    animeInfo: getAnime(editId),
    context: {
      id: editId,
    },
  });
});

app.get("/delete/:id", async (req, res) => {
  let deleteId = req.params.id;
  console.log(animeDatabase[deleteId]);
  delete animeDatabase[deleteId];
  await fs.writeFile("./public/animeDB.json", JSON.stringify(animeDatabase));
  res.redirect("/");
});

app.post("/add", async (req, res) => {
  let newId = Object.keys(animeDatabase).length + 1;
  
  const newAnime = {
    title: _.startCase(_.toLower(req.body.title)),
    genre: _.startCase(_.toLower(req.body.genre)),
    releaseYear: _.startCase(_.toLower(req.body.releaseYear)),
    creator: _.startCase(_.toLower(req.body.creator)),
  };

  animeDatabase[newId] = newAnime;

  await fs.writeFile("./public/animeDB.json", JSON.stringify(animeDatabase));

  res.redirect("/");
});

app.post("/edit/:id", async (req, res) => {
  let editId = req.body;
  animeDatabase[editId.id].title = _.startCase(_.toLower(editId.title));
  animeDatabase[editId.id].genre = _.startCase(_.toLower(editId.genre));
  animeDatabase[editId.id].releaseYear = _.startCase(_.toLower(editId.releaseYear));
  animeDatabase[editId.id].creator = _.startCase(_.toLower(editId.creator));

  await fs.writeFile("./public/animeDB.json", JSON.stringify(animeDatabase));

  res.redirect("/");
});

app.post("/search", (req, res) => {
  let searchName = req.body.title;
  if (!getAnime(searchName).info) {
    res.render("landing", {
      layout: "not-found-layout",
      dataAvailable: false,
    });
    res.status(404);
  } else {
    res.render("landing", {
      layout: "main-layout",
      animeEntries: getAnime(searchName),
      dataAvailable: false,
    });
  }
});

app.use("*", (req, res) => {
  res.render("landing", {
    layout: "not-found-layout",
    dataAvailable: false,
  });
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
