import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      hotel_name,
      leader_name,
      circle_name,
      phone,
      date,
      people_count,
      budget,
      user_line_id,
    } = body;

    const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;

    // 通知用テキストメッセージのフォーマット
    const notificationMessage = `
📢 **【新着】サークル合宿の見積もり・空き確認依頼が届きました！**
━━━━━━━━━━━━━━━━━━━━━━
🏨 **希望宿**: ${hotel_name || '指定なし'}
👤 **幹事様名**: ${leader_name}
🏫 **サークル名**: ${circle_name}
📞 **電話番号**: ${phone}
📅 **希望日程**: ${date}
👥 **参加人数**: ${people_count}名
💰 **1人あたり予算**: ${budget}
🆔 **LINE User ID**: ${user_line_id || '未取得'}
⏰ **送信日時**: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
━━━━━━━━━━━━━━━━━━━━━━
`.trim();

    console.log('Sending Notification:\n', notificationMessage);

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: notificationMessage,
            text: notificationMessage,
          }),
        });
      } catch (webhookErr) {
        console.error('Webhook sending failed:', webhookErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Notification processed' });
  } catch (error: any) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
