/** Danh mục môn đang được EDUBRIDGE hỗ trợ trên giao diện.
 * Đây là lựa chọn sản phẩm, không phải danh mục đầy đủ theo CTGDPT 2018.
 * Không xóa dữ liệu SGK, học liệu hoặc bài giảng đã lưu cho các môn khác.
 */
export const SUBJECT_GROUPS = [
 {id:'mandatory',label:'Môn học bắt buộc',items:['Ngữ văn','Toán','Lịch sử']},
 {id:'elective',label:'Môn học lựa chọn',items:['Địa lí','Giáo dục kinh tế và pháp luật','Vật lí','Hóa học','Sinh học','Công nghệ','Tin học']}
] as const;
export const SUBJECT_NAMES=SUBJECT_GROUPS.flatMap(g=>[...g.items]);
export type SubjectName=(typeof SUBJECT_NAMES)[number];
export function isValidSubject(value:unknown):value is SubjectName{
 return typeof value==='string' && SUBJECT_NAMES.some(name=>name===value);
}
