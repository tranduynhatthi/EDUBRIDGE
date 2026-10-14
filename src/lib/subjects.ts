/** Danh sách môn học cấp THPT theo CTGDPT 2018 (đã điều chỉnh theo TT 13/2022). */
export const SUBJECT_GROUPS = [
 {id:'mandatory',label:'Môn học bắt buộc',items:['Ngữ văn','Toán','Ngoại ngữ 1','Lịch sử','Giáo dục thể chất','Giáo dục quốc phòng và an ninh']},
 {id:'elective',label:'Môn học lựa chọn',items:['Địa lí','Giáo dục kinh tế và pháp luật','Vật lí','Hóa học','Sinh học','Công nghệ','Tin học','Âm nhạc','Mĩ thuật']},
 {id:'optional',label:'Môn học tự chọn',items:['Ngoại ngữ 2','Tiếng dân tộc thiểu số']}
] as const;
export const SUBJECT_NAMES=SUBJECT_GROUPS.flatMap(g=>[...g.items]);
export type SubjectName=(typeof SUBJECT_NAMES)[number];
export function isValidSubject(value:unknown):value is SubjectName{
 return typeof value==='string' && SUBJECT_NAMES.some(name=>name===value);
}
