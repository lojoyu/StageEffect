var serverHost;

var setupHost = () => {
  switch (process.env.NODE_ENV) {
    case "local":
      serverHost = "http://localhost:8000";
      break;
    case "production":
      //break;
    default: 
      serverHost = "";
  }
  console.log("server: "+ serverHost)
}

setupHost();
module.exports.serverHost = serverHost;