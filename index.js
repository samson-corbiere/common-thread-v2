const express = require ('express')
const app = express()
const port = 3000;
const connection = require("./config");
const bodyParser =require("body-parser")

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse the raw data
app.use(bodyParser.raw());
// parse text
app.use(bodyParser.text());

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

app.get("/", (req, res) => {
  res.send("Welcome to express")
})

// (1) GET - Retrieve all of the data from your table
app.get('/api/series', (req, res) => {
  connection.query('SELECT * FROM series', (err, results) => {
    if (err) {
      res.status(500).send('Error retrieving series');
    } else {
      res.json(results);
    }
  });
});

// (2) GET - Retrieve specific fields (i.e. series names)
app.get('/api/series/:name', (req, res) => {
  const searchName = req.params.name
  connection.query(`SELECT * from series where name = ?`, [searchName], (err, results) => {
    if (err) {
      res.status(500).send('Error retrieving series');
    } else {
      console.log("ça rentre bien")
      res.status(200).json(results);
    }
  });
});

// (3-1) GET - Retrieve a data set with the following filters (contain)
app.get('/api/contain', (req, res) => {
  const searchName = req.query.name
  connection.query(`SELECT * from series`, [searchName], (err, results) => {
    if (err) {
      res.status(500).send('Error retrieving series');
    } else {
      const matchingSeries = results.filter(serie => serie.name == searchName)
      if (matchingSeries.length > 0) {
        res.status(200).json(matchingSeries);
      } else {
        res.status(404).send('no series found with this title')
      }
    }
  });
});

// (3-2) GET - Retrieve a data set with the following filters (start with)
app.get('/api/start/:name', (req, res) => {
  let name = req.params.name
  connection.query(`SELECT * from series where name like '${name}%'`, (err, results) => {
    if (err == null && results == "") {
      res.status(404).send('no series found with this title')
    } else {
      res.status(200).json(results)
    }
  })
})

// (3-3) GET - Retrieve a data set with the following filters (greater than)
app.get("/api/date", (req, res) => {
  connection.query("SELECT * from series WHERE date <=?", [req.query.maxDate], (err, results) => {
  if (err) {
    res.status(500).send("there is error");
  } else {
    const matchingMovies = results.filter(
      series => series.date <= req.query.maxDate
    );
    if (matchingMovies.length > 0) {
      res.json(matchingMovies);
    } else {
      res.status(404).send("sorry, no movies");
    }
  }
  });
});

// (4) GET - ascending
app.get('/name/ascending', (req, res) => {
  connection.query("SELECT * FROM series ORDER BY name ASC", (err, results) => {
    if(err){
      res.status(500).send("Error retriving data")
    } else {
      res.status(200).json(results)
    }
  })
});

// (5) POST - new series
app.post('/newseries', (req,res) => {
  const { name, released_Date, watched} = req.body;
  connection.query (
    'INSERT INTO series (name, released_Date, watched) VALUES (?,?,?)',
    [name, released_Date, watched],
    (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("error create new series");
      } else {
        res.status(200).send("success to create new series");
      }
    }
  )
})

// (6) put modification of an entity
app.put("/series/:id", (req, res) => {
  const seriesId = req.params.id;
  const newseries = req.body;
  connection.query(
    "UPDATE series SET ? WHERE id = ?",
    [newseries, seriesId],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error updating the series");
      } else {
        res.status(200).send("series updated successfully 🎉");
      }
    }
  );
});

// (7) toggle boolean value 
app.put("/series/:id", (req, res) => {
  const seriesId = req.params.id;
  connection.query(
    "UPDATE series SET watched = !watched WHERE id = ?",
    [seriesId],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error updating the series");
      } else {
        res.status(200).send("series updated successfully 🎉");
      }
    }
  );
});

// DELETE - Delete an entity
app.delete("series/:id", (req, res) => {
  const seriesId = req.params.id;
  connection.query(
    "DELETE FROM series WHERE id = ?",
    [seriesId],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send("😱 Error deleting the series");
      } else {
        res.status(200).send("🎉 series deleted!");
      }
    }
  );
});

// DELETE - Delete all entities where boolean value is false

app.delete("/series/not_watched", (req, res) => {
  connection.query(
    "DELETE FROM series WHERE watched = 0", (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send("😱 Error deleting the non watched series");
      } else {
        res.status(200).send("🎉 Non watched series deleted!");
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});