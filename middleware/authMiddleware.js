const jwt = require("jsonwebtoken");

const isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Token not found / Unauthorized user" });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        res.status(401);
        throw new Error("User is not authorized");
      }
      req.user = decoded.user;
      next();
    });

    if (!token) {
      res.status(401);
      throw new Error(
        "User is not authorized or token is missing in the request"
      );
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = { isAuthenticated };
