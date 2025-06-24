import JWT from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.json({ success: false, message: "Not authorized, login again" });
  }

  try {
    const tokenDecode = JWT.verify(token, process.env.SECRET);
    console.log(tokenDecode);

    if (tokenDecode.id) {
      if (!req.body) req.body = {}; // ✅ Ensure req.body exists
      req.body.userId = tokenDecode.id;
    } else {
      return res.json({ success: false, message: "Not authorized, login again" });
    }

    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default userAuth;
