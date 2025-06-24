import usermodel from "../models/usermodel.js";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import razorpay from "razorpay";
import transactionModel from "../models/transactionModel.js";


const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ sucess: false, message: "Missing Details" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new usermodel(userData);
    const user = await newUser.save();

    const token = JWT.sign({ id: user._id }, process.env.SECRET);

    res.json({ sucess: true, token, user: { name: user.name } });
  } catch (error) {
    console.log(error);

    res.json({ sucess: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await usermodel.findOne({ email });
    if (!user) {
      return res.json({ sucess: false, message: "User doest exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = JWT.sign({ id: user._id }, process.env.SECRET);

      res.json({ sucess: true, token, user: { name: user.name } });
    } else {
      return res.json({ sucess: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    console.log(error);

    res.json({ sucess: false, message: error.message });
  }
};

const userCredits = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await usermodel.findById(userId);
    res.json({
      success: true,
      credits: user.creditBalance,
      user: { name: user.name },
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.APIKEY_ID,
  key_secret: process.env.APIKEY_SECRET,
});

const paymentRazorpay = async (req, res) => {
  try {
    const { userId, planId } = req.body;
    const userData = await usermodel.findById(userId);

    if (!userId || !planId) {
      return res.json({ success: false, message: "Missing Details" });
    }

    let credits, plan, amount, date;

    switch (planId) {
      case 'Basic':
        credits = 100;
        plan = 'Basic';
        amount = 10;
        break;
      case 'Advanced':
        credits = 500;
        plan = 'Advanced';
        amount = 50;
        break;
      case 'Business':
        credits = 5000;
        plan = 'Business'; 
        amount = 250;
        break;
      default:
        return res.json({ success: false, message: "Invalid Plan" });
    
    }
    date = Date.now();
    const transactionData={
      userId,
      plan,
      credits,
      amount,
      date,
    }
const newTransaction = await transactionModel.create(transactionData);

const options = {
  amount:amount * 100, // amount in the smallest currency unit
  currency: process.env.CURRENCY,
  receipt: newTransaction._id,

  

}
await razorpayInstance.orders.create(options,(error,order)=>{
  if(error){
    console.log(error);
    return res.json({ success: false, message: error });
  }
  res.json({
    success: true,order,});
});

    

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyRazorpay=async(req,res)=>{
  try {
        const {razorpay_order_id} = req.body;
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        if(orderInfo.status === "paid"){


          const transactionData = await transactionModel.findById(orderInfo.receipt);

          if(transactionData.payment){
            return res.json({ success: false, message: "Payment Failed" });
          }

          const userData = await usermodel.findById(transactionData.userId);
          const creditBalance = userData.creditBalance + transactionData.credits;
          await usermodel.findByIdAndUpdate(userData._id, { creditBalance });

          await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true });

          res.json({ success: true, message: "Credits Added" });
        }
        else {
          res.json({ success: false, message: "Credits Failed" });
        }   
        
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}
export { registerUser, loginUser, userCredits, paymentRazorpay , verifyRazorpay };
