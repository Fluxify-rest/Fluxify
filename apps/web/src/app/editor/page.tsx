"use server";
import { redirect } from "next/navigation";

const page = async () => {
	return redirect("/routes");
};

export default page;
