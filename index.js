const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Schema } = mongoose;
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: String
});

const userSchema = new Schema({
  username: { type: String, required: true },
  log: [{type: Schema.Types.ObjectId, ref: 'Exercise'}]
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const createAndSaveUser = (newUsername, done) => {
  let newUser = new User({ username: newUsername });
  
  newUser.save((err, data) => {
    if(err) return console.error(err);
    done(null, data);
  });
};

const createAndSaveExercise = (userId, desc, dur, date, done) => {
  let newExerData = new Exercise({
      description: desc,
      duration: dur,
      date: date
  });

  newExerData.save((err) => {
    if(err) return console.error(err);
    
      User.findByIdAndUpdate(userId, {$push: {log: newExerData._id}}, (err, data) => {
      if(err) return console.error(err);
      done(null, data);
    });
  });
};

const findAllUsers = (done) => {
  User.find().select({username: 1, _id: 1}).exec((err, data) => {
    if(err) return console.error(err);
    done(null, data);
  });
}

// const getAllLogs = (userId, from, to, limit, done) => {
//   User.findById(userId).populate('log').select({"__v": 0}).exec((err, data) => {
//       if(err) return console.error(err);

//       console.log("Initial logs: ", data);
      
//       if(from != null) {
//         let fromMilliSeconds = new Date(from);

//         data.log = data.log.filter((el) => {
//           return new Date(el.date) >= fromMilliSeconds;
//         });
//       }

//       if(to !== null) {
//         let toMilliSeconds = new Date(to);
        
//         data.log = data.log.filter((el) => {
//           return new Date(el.date) <= toMilliSeconds;
//         });
//       }

//       if(limit !== null) {
//         data.log = data.log.slice(0, limit);
//       }
    
//       // console.log("Data in callback: ", data);
//       done(null, data);
//   });
// }

app.post("/api/users", (req, res, done) => {
  createAndSaveUser(req.body.username, (err, data) => {
    res.json({
      "username": data.username,
      "_id": data._id 
    });

    done(null, data);
  });
});

app.post("/api/users/:_id/exercises", (req, res, done) => {
  let userId = req.params._id;
  let desc = req.body.description;
  let dur = req.body.duration;
  let date = req.body.date? new Date(req.body.date).toDateString(): new Date().toDateString();
  
  createAndSaveExercise(userId, desc, dur, date, (err, data) => {
    if(err) return console.error(err);
    
    res.json({
      "_id": userId,
      "username": data.username,
      "date": date,
      "duration": parseInt(dur),
      "description": desc
    });
    
    done(null, data);
  });
});

app.get("/api/users", (req, res, done) => {
  findAllUsers((err, data) => {
    if(err) return console.error(err);
    res.send(data);

    done(null, data);
  });
});

app.get("/api/users/:_id/logs", (req, res, done) => {
  let userId = req.params._id;
  let from = req.query.from || null;
  let to = req.query.to || null;
  let limit = req.query.limit || null;
  
  // getAllLogs(userId, from, to, limit, (err, data) => {
  //   if(err) return console.log(err);
    
  //   res.json({
  //     "username": data.username,
  //     "_id": userId,
  //     "count": data.log.length,
  //     "log": data.log
  //   });
    
  //   done(null, data);
  // });

  User.findById(userId).populate('log').select({"__v": 0}).exec((err, data) => {
      if(err) return console.error(err);

      // console.log("Initial logs: ", data);
      
      if(from != null) {
        // let fromMilliSeconds = new Date(from);

        data.log.filter(el => 
          el.date >= from
        );
      }

      if(to !== null) {
        // let toMilliSeconds = new Date(to);
        
        data.log.filter(el => 
          el.date <= to
        );
      }

      if(limit !== null) {
        data.log = data.log.slice(0, limit);
      }
      
    
      res.json({
        "username": data.username,
        "_id": userId,
        "count": data.log.length,
        "log": data.log
      });
    
      done(null, data);
  });
});
  
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
