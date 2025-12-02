import { IonIcon } from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';

interface StaticStarRatingProps {
    // The rating value, which may include decimals (e.g., 4.7)
    rating: number;
    // Total number of stars to display (default is 5)
    starCount?: number;
    // icon color
    color?: string;
    // icon size
    fontSize?: string;
}

const StaticStarRating: React.FC<StaticStarRatingProps> = ({
    rating,
    starCount = 5,
    color = 'grayscale-400',
    fontSize = '14px',
}) => {
    // Round the rating to the nearest whole number
    const roundedRating = Math.round(rating);

    return (
        <div className="flex items-center">
            {Array.from({ length: starCount }, (_, index) => (
                <IonIcon
                    key={index}
                    icon={index < roundedRating ? star : starOutline}
                    color={color}
                    style={{ fontSize: fontSize }}
                    className="mr-[1px]"
                />
            ))}
        </div>
    );
};

export default StaticStarRating;
