import React from 'react';
import { useParams, Link } from 'react-router-dom';

function LectureViewPage() {
  const { topicId } = useParams(); // URL'den topicId'yi al

  // TODO: Backend'den /api/lectures?topicId=X isteği ile
  //       ilgili konu anlatımlarını çek ve göster.
  //       LectureList component'i bunun için kullanılabilir veya uyarlanabilir.

  return (
    <div>
      <h2>Konu Anlatımları (Konu ID: {topicId})</h2>
      <p>Bu konuya ait anlatımlar burada gösterilecek.</p>
      <p><em>(Bu bölüm henüz geliştirilmektedir.)</em></p>
      <br />
      <Link to="/browse">Konulara Geri Dön</Link> {/* /browse olacak şekilde güncelledik */}
    </div>
  );
}

export default LectureViewPage;