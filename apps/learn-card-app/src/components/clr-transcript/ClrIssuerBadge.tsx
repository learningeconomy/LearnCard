import { UserProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';

type Props = {
    logoSrc?: string;
    issuerName?: string;
    size?: number;
};

const ClrIssuerBadge = ({ logoSrc, issuerName, size = 50 }: Props) => {
    const innerSize = Math.round(size * 0.58);

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 50 50"
                fill="none"
            >
                <path
                    d="M41.4499 43.8755C36.8009 42.7935 34.3277 44.1251 32.9723 48.5363C32.5205 50.0107 30.7132 50.4863 29.6074 49.4162C26.3495 46.2891 23.6505 46.2891 20.3926 49.4162C19.2749 50.4863 17.4795 50.0226 17.0277 48.5363C15.6841 44.1251 13.211 42.7935 8.55012 43.8755C7.07575 44.2203 5.77974 42.9124 6.12455 41.4499C7.20655 36.8009 5.87486 34.3277 1.46365 32.9723C-0.0107132 32.5205 -0.486315 30.7132 0.583789 29.6074C3.71087 26.3495 3.71087 23.6505 0.583789 20.3926C-0.486315 19.2749 -0.0226032 17.4795 1.46365 17.0277C5.87486 15.6841 7.20655 13.211 6.12455 8.55012C5.77974 7.07575 7.08765 5.77974 8.55012 6.12455C13.1991 7.20655 15.6723 5.87486 17.0277 1.46365C17.4795 -0.0107132 19.2868 -0.486315 20.3926 0.583789C23.6505 3.71087 26.3495 3.71087 29.6074 0.583789C30.7251 -0.486315 32.5205 -0.0226032 32.9723 1.46365C34.3158 5.87486 36.789 7.20655 41.4499 6.12455C42.9242 5.77974 44.2203 7.08765 43.8755 8.55012C42.7935 13.1991 44.1251 15.6723 48.5363 17.0277C50.0107 17.4795 50.4863 19.2868 49.4162 20.3926C46.2891 23.6505 46.2891 26.3495 49.4162 29.6074C50.4863 30.7251 50.0226 32.5205 48.5363 32.9723C44.1251 34.3158 42.7935 36.789 43.8755 41.4499C44.2203 42.9242 42.9124 44.2203 41.4499 43.8755Z"
                    fill="#52597A"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <div style={{ width: innerSize, height: innerSize }}>
                    <UserProfilePicture
                        user={{ image: logoSrc, displayName: issuerName }}
                        customSize={innerSize}
                        customContainerClass="w-full h-full rounded-full text-xs font-bold"
                        customImageClass="w-full h-full rounded-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default ClrIssuerBadge;
