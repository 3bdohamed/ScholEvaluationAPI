import Link from  "next/link";

export default function Footer(){
    var abdo="<Abdo>"
    return(
        <footer className="bg-white border-t border-gray-100 text-gray-600 py-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="text-sm font-medium text-gray-800 text-center">
          © {new Date().getFullYear()} School Evaluation. All rights reserved. <br /> developed by 
          <a href="https://github.com/3bdohamed" className="hover:text-rose-500/80 font-bold text-sm text-shadow-gray-500 transition-colors px-1">{abdo}</a>
        </div>
        <div className="flex space-x-6 text-sm font-medium">
          <Link href="/" className="hover:text-blue-600 transition-colors">github account</Link>
          <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
        </div>
      </div>
    </footer>
    )
}