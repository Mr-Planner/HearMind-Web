import hideside from "../assets/sidebar/hideside.svg";




function HiddenSideBar({ handleToggleSideBar }: { handleToggleSideBar: () => void }) {

    return (
        <aside className="flex flex-col bg-gray-50 w-10 items-center">
            <button className = "hover:bg-gray-300 rounded cursor-pointer p-1" onClick={handleToggleSideBar}>
                    <img src = {hideside} alt = "사이드바 열기"></img>
            </button>


        </aside>
    )
}

export default HiddenSideBar;