var express=require("express"),
    bodyParser=require("body-parser"),
    flash=require("connect-flash"),
    mongoose=require("mongoose"),
    passport=require("passport"),
    localStrategy=require("passport-local"),
    passportlocalmongoose=require("passport-local-mongoose"),
    expresssession=require("express-session"),
    methodoverride=require("method-override");
var app=express();



mongoose.connect("mongodb://localhost/camp3");



var userSchema =new mongoose.Schema({
  name:String,
  password:String
});
userSchema.plugin(passportlocalmongoose);
var user=mongoose.model("user",userSchema);



var commentSchema =new mongoose.Schema({
    title:String,
    author:String,
    au:{
      id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
      }
    }
});
var comment=mongoose.model("comment",commentSchema);



var campSchema = new mongoose.Schema({
  name: String,
  image: String,
  description:String,
  author:{
    id:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"users"
    }
  },
  comment:
  [
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"comment"
    }
  ]
});
var camp=mongoose.model("campgrounds",campSchema);





app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname+"/partials"));
app.use(expresssession({
  secret:"amardeep",
  resave: false,
  saveUnintialized:false

}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodoverride("_method"));
app.use(flash());
passport.use(new localStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
app.use(function(req,res,next){
   res.locals.currentUser=req.user;
   res.locals.message=req.flash("error");
   res.locals.smessage=req.flash("success");
   next();
});


app.get("/",function(req,res){
  res.render("home");
});

app.get("/campgrounds",function(req,res){
  camp.find({},function(err,campgrounds){
  	if(err)
  		console.log(err);
  	else
  		{  //console.log(req.user);
         res.render("camps",{camp:campgrounds});
  		}
  });
});

app.post("/campgrounds",isloggedin,function(req,res){
  
  var name= req.body.name;
  var image=req.body.image;
  var description=req.body.description;
  var author={ id :req.user.id }
  var newcamp={name:name , image: image , description: description, author: author };

  camp.create(newcamp,function(err,campgrounds){
  	if(err)
  		console.log(err);
  	else
  	    { req.flash("success","New Campground Posted");
          res.redirect("/campgrounds");
        }	
  })
});

app.get("/campgrounds/new",isloggedin, function(req,res){
    res.render("new");
});

app.get("/campgrounds/:id",function(req,res){
   var cureid=req.params.id;
   cureid = cureid.replace(/\s/g,'');
   camp.findById(cureid).populate("comment").exec(function(err,campground){
     if(err)
     	console.log(err);
     else
        { //console.log(campground);
          res.render("show",{camp:campground,comment:comment});
        }
   });
});

app.get("/campgrounds/:id/comments",isloggedin,function(req,res){
   var cureid=req.params.id;
   cureid = cureid.replace(/\s/g,'');
   camp.findById(cureid,function(err,campground)
   {
     if(err)
       console.log(err);
     else
     {
       res.render("comments",{camp:campground});
     }
   });
});

app.post("/campgrounds/:id/comments",isloggedin,function(req,res){
  var cureid=req.params.id;
  cureid = cureid.replace(/\s/g,'');
  camp.findById(cureid,function(err,campground)
  {
    if(err)
      console.log(err);
    else
    { 
      comment.create(req.body.comment,function(err,comment){
        if(err)
           console.log(err);
        else
          { var au={id:req.user.id};
            comment.au=au;
            comment.save();
            //console.log(comment);
            campground.comment.push(comment);
            campground.save();
            req.flash("success","New Comment Posted");
            res.redirect("/campgrounds/"+cureid);
          }
      })
    }
  });
});

app.get("/campgrounds/:id/edit",isuserloggedin, function(req,res){
  var cureid=req.params.id;
  cureid = cureid.replace(/\s/g,'');
  camp.findById(cureid,function(err,campground){
    if(err)
      console.log(err);
    else
    {
      res.render("edit",{camp:campground});
    }
  })
});

app.put("/campgrounds/:id",isuserloggedin, function(req,res){
  var cureid=req.params.id;
  cureid = cureid.replace(/\s/g,'');
  camp.findByIdAndUpdate(cureid,req.body.camp,function(err,campground){
     if(err)
       console.log(err);
     else{
       req.flash("success","Successfully edited the post");
       res.redirect("/campgrounds/"+cureid);
     }
  })
});

app.get("/campgrounds/:id/comments/:comm_id/edit",iscommentor, function(req,res){
   var cureid=req.params.id;
   cureid = cureid.replace(/\s/g,'');
   camp.findById(cureid,function(err,camp){
      if(err)
         console.log(err);
      else{
        var commid=req.params.comm_id;
        commid = commid.replace(/\s/g,'');
        comment.findById(commid,function(err,comment){
          res.render("commentedit",{camp:camp,comment:comment});
        })
      }
   })
});

app.put("/campgrounds/:id/comments/:comm_id",iscommentor, function(req,res){
  var cureid=req.params.id;
  cureid = cureid.replace(/\s/g,'');
  camp.findById(cureid,function(err,camp){
     var commid=req.params.comm_id;
     commid = commid.replace(/\s/g,'');
     comment.findByIdAndUpdate(commid,req.body.comment,function(err,comment){
       if(err)
       console.log(err);
       else{
         req.flash("success","Successfully edited the comment");
         res.redirect("/campgrounds/"+cureid);
       }
     })
   })
});

app.delete("/campgrounds/:id", isuserloggedin, function(req,res){
  var cureid=req.params.id;
  cureid = cureid.replace(/\s/g,'');
  camp.findByIdAndRemove(cureid,function(err,campground){
     req.flash("success","Campground deleted");
     res.redirect("/campgrounds");
})
});

app.delete("/campgrounds/:id/comments/:comm_id",iscommentor, function(req,res){
  var cureid=req.params.id;
  cureid = cureid.replace(/\s/g,'');
  var commid=req.params.comm_id;
  commid = commid.replace(/\s/g,'');
  camp.findById(cureid,function(err,campground){
    if(err)
       console.log(err);
    else{
        comment.findByIdAndRemove(commid,function(err,comment){
        req.flash("success","Comment deleted");
        res.redirect("/campgrounds/"+cureid);
      })
    }    
  })
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res)
{
   user.register(new user({username:req.body.username}),req.body.password,function(err,user)
   {
      if(err)
      {   req.flash("error",err.message);
          res.render("register");
      }
      passport.authenticate("local")(req,res,function()
      { req.flash("success","welcome to yelpcamp "+ user.username);
        res.redirect("/campgrounds");
      })
   })
});

app.get("/login",function(req,res){
  res.render("login");
});

app.post("/login",passport.authenticate("local" ,{
     successRedirect:"/campgrounds",
     failureRdeirect:"/login"
    }) ,function(req,res){
      //req.flash("success","Successfully logged u in !!!")
});

app.get("/logout",function(req,res){
  req.logout();
  req.flash("error","Logged u out ,Successfully!!!")
  res.redirect("/");
});

function isloggedin(req,res,next)
{
   if(req.isAuthenticated())
     next();
   else{
     req.flash("error","You need to log in first!!!")
     res.redirect("/login");
   }
}

function isuserloggedin(req,res,next){
   if(req.isAuthenticated())
   {  
     camp.findById(req.params.id,function(err,camp){
       if(err)
        { 
          console.log(err);
        }
       else{
        if(camp.author.id.equals(req.user._id))
          next();
       else{
          req.flash("error","unauthorized user")
          res.redirect("/campgrounds/"+req.params.id);
       }
       }
     })
   }
   else
   { req.flash("error","You need to log in first!!!")
     res.redirect("/login");
   }
}

function iscommentor(req,res,next)
{  if(req.isAuthenticated()){ 
       comment.findById(req.params.comm_id,function(err,comment){
       if(err)
       console.log(err);
       else{
        if(comment.au.id.equals(req.user._id))
          next();
        else{
        req.flash("error","unauthorized user")
        res.redirect("/campgrounds/"+req.params.id);
        }
       }
   })
   }
   else{
   req.flash("error","You need to log in first!!!")
   res.redirect("/login");
   }
}

console.log("server started");
app.listen(9001,'127.0.0.1');