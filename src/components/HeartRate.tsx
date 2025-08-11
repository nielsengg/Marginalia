import { useState } from "react";
import { FaHeart } from "react-icons/fa"

type HeartRateProps = {
  setStateChange: React.Dispatch<React.SetStateAction<boolean>>;
};


export default function HeartRate({ setStateChange }: HeartRateProps){
    const [heart, setHeart] = useState(false);
    const [hover, setHover] = useState(false);
    return(
        <>
        <div
            className="cursorPointer"
            style={{ aspectRatio: "1/1", height: "100%" }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <FaHeart
            onClick={() => {
                setHeart(prev => !prev);
                setStateChange(prev => !prev);
            }}
            color={(heart || hover) ? "rgba(205, 50, 50, 1)" : "gray"}
            />
        </div>
        </>
    )
}