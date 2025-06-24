import mongoose from "mongoose";

const connectDB = async () =>{
     
    mongoose.connection.on('connected',()=>{
        console.log('connected to MongoDB');
    })

    await mongoose.connect(`${process.env.MONGODB_URI}/TEXTTOIMG`)
}

export default connectDB;