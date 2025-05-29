
const LoginSidebar = () => {
    return (
        <div className="w-[30%] h-screen relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-12 flex flex-col justify-center items-start text-white">
            {/* 3D Ring Logo */}
            <div className="relative mb-8">
                <div className="w-32 h-32 relative">
                    {/* Main ring */}
                    <div className="absolute inset-0 rounded-full border-8 border-white opacity-20 transform rotate-12"></div>
                    <div
                        className="absolute inset-2 rounded-full transform -rotate-45"
                        style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)',
                            boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.2)'
                        }}
                    ></div>
                    <div className="absolute inset-6 rounded-full bg-gray-900 opacity-80"></div>
                </div>
            </div>

            {/* Adobe Icons */}
            <div className="flex gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    Ae
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    Pr
                </div>
            </div>

            {/* Main Text */}
            <div className="space-y-2">
                <h1 className="text-5xl font-bold leading-tight">
                    Get Premium<br />
                    Plugins From<br />
                    One <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Place</span>
                </h1>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400 to-transparent opacity-10 rounded-full transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-400 to-transparent opacity-10 rounded-full transform -translate-x-24 translate-y-24"></div>
        </div>
    )
}

export default LoginSidebar