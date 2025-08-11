import { useEffect, useState } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

type StarRateProps = {
  setStateChange: React.Dispatch<React.SetStateAction<number>>;
};

export default function StarRate({ setStateChange }: StarRateProps) {
    const [rating, setRating] = useState<number>(0);
    const [hover, setHover] = useState<number>(0);

    const handleClick = (index: number, isHalf: boolean) => {
        setRating(isHalf ? index + 0.5 : index + 1);
    };

    // Stores the user's rating
    useEffect(() => {
        setStateChange(rating);
    }, [rating]);

    const handleMouseMove = (e: React.MouseEvent, index: number) => {
        const { left, width } = (e.target as HTMLElement).getBoundingClientRect();
        const x = e.clientX - left;
        setHover(x < width / 2 ? index + 0.5 : index + 1);
        setTimeout(() => {
            setHover(0);
        }, 3000);
    };

    const handleMouseLeave = () => {
        setHover(0);
    };


    return (
        <div
            className="cursorPointer"
            style={{ display: "flex", flexDirection: "row", gap: "0.1rem" }}
            onMouseLeave={handleMouseLeave}
        >
            {[...Array(5)].map((_, index) => {
                let icon;
                if (!hover){
                    if (rating >= index + 1) {
                        icon = <FaStar color="rgb(205, 177, 50)" />;
                    } else if (rating >= index + 0.5) {
                        icon = <FaStarHalfAlt color="rgb(205, 177, 50)" />;
                    } else {
                        icon = <FaRegStar color="gray" />;
                    }
                }

                if (hover >= index + 1) {
                    icon = <FaStar color="rgba(205, 177, 50, 0.7)" />;
                } else if (hover >= index + 0.5) {
                    icon = <FaStarHalfAlt color="rgba(205, 177, 50, 0.7) "/>;
                } else if (hover){
                    icon = <FaRegStar color="gray" />;
                }
                return (
                    <span
                        key={index}
                        onClick={e => {
                            const { left, width } = (e.target as HTMLElement).getBoundingClientRect();
                            const x = e.clientX - left;
                            handleClick(index, x < width / 2);
                        }}
                        onMouseMove={e => handleMouseMove(e, index)}
                        style={{ cursor: "pointer", aspectRatio: "1/1", height: "100%" }}
                        
                    >
                        {icon}
                    </span>
                );
            })}
        </div>
    );
}