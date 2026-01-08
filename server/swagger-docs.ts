/**
 * @swagger
 * /api/presentations:
 *   get:
 *     summary: Get all presentations for the logged-in user
 *     tags:
 *       - Presentations
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of presentations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Presentation'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new presentation
 *     tags:
 *       - Presentations
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Presentation created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Presentation'
 *       401:
 *         description: Unauthorized
 *
 * /api/presentations/{id}:
 *   get:
 *     summary: Get a specific presentation
 *     tags:
 *       - Presentations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Presentation ID
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Presentation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Presentation'
 *       404:
 *         description: Presentation not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update a presentation
 *     tags:
 *       - Presentations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Presentation updated
 *   delete:
 *     summary: Delete a presentation
 *     tags:
 *       - Presentations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       204:
 *         description: Presentation deleted
 *       404:
 *         description: Presentation not found
 *
 * /api/templates:
 *   get:
 *     summary: Get all available templates
 *     tags:
 *       - Templates
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by template category
 *     responses:
 *       200:
 *         description: List of templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: No templates found
 *
 * /api/coach/feedback:
 *   post:
 *     summary: Get AI coaching feedback for a presentation
 *     tags:
 *       - Coach
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               presentationId:
 *                 type: integer
 *               slideIndex:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI coaching feedback
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *
 * /api/ocr:
 *   post:
 *     summary: Extract text from images using OCR
 *     tags:
 *       - OCR
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Extracted text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *       400:
 *         description: Bad request
 *
 * /api/google-slides/{presentationId}:
 *   get:
 *     summary: Get Google Slides presentation info
 *     tags:
 *       - Google Slides
 *     parameters:
 *       - in: path
 *         name: presentationId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Presentation information
 *       404:
 *         description: Presentation not found
 */

export const swaggerDocs = {
  description: 'SlideBanai API Documentation',
};
