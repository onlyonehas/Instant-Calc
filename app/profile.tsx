import { User } from "firebase/auth"

type Profile = {
  user: User | null
}

export const Profile = ({ user }: Profile) => {
  const displayName = user?.displayName
  const imgSrc = user?.photoURL || ""

  if (user)
    return (
      <div className="flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center max-w-xs p-4 bg-white rounded-3xl md:flex-row">
          <div className="-mt-28 md:-my-16 md:-ml-32" style={{ clipPath: `url(#roundedPolygon)` }}>
            <img
              className="w-auto h-48"
              src={imgSrc}
              alt="Profile Picture" />
          </div><div className="flex flex-col space-y-4">
            <div className="flex flex-col items-center md:items-start">
              <h2 className="text-xl font-medium">{displayName}</h2>
              <p className="text-base font-medium text-gray-400">Calculations</p>
            </div>
          </div><svg width="0" height="0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id="roundedPolygon">
                <path
                  d="M79 6.237604307034a32 32 0 0 1 32 0l52.870489570875 30.524791385932a32 32 0 0 1 16 27.712812921102l0 61.049582771864a32 32 0 0 1 -16 27.712812921102l-52.870489570875 30.524791385932a32 32 0 0 1 -32 0l-52.870489570875 -30.524791385932a32 32 0 0 1 -16 -27.712812921102l0 -61.049582771864a32 32 0 0 1 16 -27.712812921102" />
              </clipPath>
            </defs>
          </svg>
        </div >
      </div>
    )
}