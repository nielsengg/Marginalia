import { useState } from "react";
import { FaHeart } from "react-icons/fa"

export default function HeartRate(){
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
            onClick={() => setHeart((prev) => !prev)}
            color={(heart || hover) ? "rgba(205, 50, 50, 1)" : "gray"}
            />
        </div>
        </>
    )
}