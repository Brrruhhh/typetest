import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../utils/database';
import UserResult, { IUserResult } from '../../models/UserResult';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  try {
    if (req.method === 'GET') {
      const { roomId, limit = 10 } = req.query;
      
      let query = {};
      if (roomId && roomId !== 'global') {
        query = { roomId };
      }
      
      const results = await UserResult.find(query)
        .sort({ wpm: -1 })
        .limit(parseInt(limit as string))
        .exec();
      
      res.status(200).json({ success: true, data: results });
    } else {
      res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}