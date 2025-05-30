import { useAuth } from "@renderer/context/AuthContext";

const HomePage = () => {
    const { user } = useAuth();
    return (
        <div>Welcome <span className="text-purple-500">{user?.email}</span> </div>
    )
}

export default HomePage