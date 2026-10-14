import type {Metadata} from 'next';
import './globals.css';
export const metadata: Metadata = {title:'EDUBRIDGE – AI Lesson Builder',description:'Hỗ trợ giáo viên chuẩn bị bài dạy Vật lí bằng tiếng Anh'};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="vi"><body>{children}</body></html>;
}
