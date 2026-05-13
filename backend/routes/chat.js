const express = require('express');
const axios = require('axios');
const Chat = require('../models/Chat');
const { auth } = require('../middleware/auth');

const router = express.Router();

const SYSTEM_PROMPT = `You are EduMind AI, an expert teacher and tutor for students of all grades.

You teach Maths, Science, Social Studies (SST), English, Hindi, and General Knowledge.

RULES:
- For Maths: Show full step-by-step solutions with clear working
- For Science: Explain concepts clearly with examples
- For SST: Structure answers in well-organized points or paragraphs
- For Hindi: Respond in Hindi when the question is in Hindi or asks for Hindi
- For English: Provide grammatically perfect responses with explanations
- Use simple, student-friendly language
- Always give complete, detailed answers
- Use formatting (headings, bullets, numbered lists) for clarity
- If an image is provided, carefully read the question from it and solve completely`;

async function callAI(messages, imageBase64 = null) {

  const url = "https://openrouter.ai/api/v1/chat/completions";

  const formattedMessages = [
    {
      role: "system",
      content: SYSTEM_PROMPT
    }
  ];

  messages.forEach(msg => {
    formattedMessages.push({
      role: msg.role,
      content: msg.content
    });
  });

  if (imageBase64) {
    formattedMessages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: messages[messages.length - 1].content
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`
          }
        }
      ]
    });
  }

  const body = {
    model: "qwen/qwen-2.5-72b-instruct",
    messages: formattedMessages,
    max_tokens: 4096
  };

  const response = await axios.post(url, body, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content;
}

router.post('/send', auth, async (req, res) => {

  try {

    const { message, image, chatId } = req.body;

    if (req.user.plan === 'Free' && req.user.messagesUsed >= 20) {
      return res.status(403).json({
        error: 'Free plan limit reached. Please upgrade.'
      });
    }

    let chat;

    if (chatId) {
      chat = await Chat.findOne({
        _id: chatId,
        userId: req.user._id
      });
    }

    if (!chat) {
      chat = await Chat.create({
        userId: req.user._id,
        title: message.slice(0, 40) + '...',
        messages: []
      });
    }

    chat.messages.push({
      role: 'user',
      content: message
    });

    const aiResponse = await callAI(chat.messages, image);

    chat.messages.push({
      role: 'assistant',
      content: aiResponse
    });

    await chat.save();

    req.user.messagesUsed += 1;

    await req.user.save();

    res.json({
      response: aiResponse,
      chatId: chat._id
    });

  } catch (err) {

    console.error('Chat error:', err.response?.data || err.message);

    res.status(500).json({
      error: 'AI service error: ' + (err.response?.data?.message || err.message)
    });
  }
});

router.get('/history', auth, async (req, res) => {

  try {

    const chats = await Chat.find({
      userId: req.user._id
    })
    .sort({ createdAt: -1 })
    .limit(50);

    res.json(chats);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;
