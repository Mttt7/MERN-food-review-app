import { useState } from "react";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import supabase from "../utils/supabase";
import { createClient } from "@supabase/supabase-js";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import { IUserData } from "../models/IUserData";
import { v4 as uuidv4 } from "uuid";

function NewReview() {
  const supabase = createClient(
    "https://miwgfoqqvmydfqnthiby.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pd2dmb3Fxdm15ZGZxbnRoaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc4NDU2MjgsImV4cCI6MjAzMzQyMTYyOH0.vC2kiePLEOqvq91mngWMmnP9h_WLydQBRbE0HhqXFMU"
    // process.env.VITE_SUPABASE_URL!,
    // process.env.VITE_SUPABASE_ANON_KEY!
  );

  const [rating, setRating] = useState(5.0);
  const [media, setMedia]: any = useState();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm();

  const navigate = useNavigate();
  const auth = useAuthUser<IUserData>();

  const authHeader = useAuthHeader();

  const ratingValue = watch("rating", rating);

  async function uploadImage(e: any) {
    let file = e.target.files[0];
    const fileName = `${auth?.username}/${uuidv4()}`;

    const { data, error } = await supabase.storage
      .from("images")
      .upload(fileName, file);

    if (data) {
      const { data } = supabase.storage.from("images").getPublicUrl(fileName);

      if (data.publicUrl) {
        console.log(data.publicUrl);
        setMedia(data.publicUrl); // Zapisz URL do stanu, aby można było go dodać do recenzji
      }
    } else {
      console.error(error);
      toast.error("Nie udało się przesłać obrazu.");
    }
  }

  const onSubmit = async (newReview: any) => {
    if (isValid) {
      newReview.photoUrl = media; // Przypisz pierwszy URL obrazu z listy, jeśli istnieje
      try {
        const response = await fetch(
          "http://localhost:3000/api/users/new/review",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authHeader && { Authorization: authHeader }),
            },
            body: JSON.stringify(newReview),
          }
        );

        const data = await response.json();

        if (response.status === 400) {
          throw new Error(data);
        }

        navigate("/feed");
        toast.success("Recenzja została dodana!");
      } catch (error: any) {
        console.error("Niepoprawne dane", error);
        toast.error("Nie udało się dodać recenzji");
      }
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center justify-center gap-2"
      >
        <input
          type="text"
          placeholder="Place name"
          className="input input-sm input-bordered  max-w-xs w-[300px]"
          {...register("title", { required: true, minLength: 5 })}
        />
        <input
          type="text"
          placeholder="City"
          className="input input-sm input-bordered  max-w-xs w-[300px]"
          {...register("city", { required: true, minLength: 5 })}
        />
        <textarea
          className="textarea textarea-bordered w-[300px]"
          placeholder="Comment"
          {...register("comment", { required: true, minLength: 30 })}
        ></textarea>
        <input
          type="number"
          min={1.0}
          max={10.0}
          defaultValue={5.0}
          step={0.1}
          placeholder="Rating (1-10)"
          className="input input-sm input-bordered  max-w-xs w-[300px]"
          {...register("rating")}
        />
        <progress
          className="progress progress-primary w-[300px]"
          value={ratingValue * 10} // Aktualizuje na podstawie ratingValue
          max="100"
        ></progress>
        <input
          type="text"
          placeholder="Google Maps URL"
          className="input input-sm input-bordered  max-w-xs w-[300px]"
          {...register("googleMapsUrl", { required: false, minLength: 5 })}
        />
        <input
          type="file"
          onChange={(e) => uploadImage(e)}
          className="file-input  w-[300px]"
        />
        <button className="btn btn-secondary">Dodaj</button>
      </form>
    </div>
  );
}

export default NewReview;
