import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createBaseRoles } from '../../../../test/helpers/roles';
import { createBaseUsers, TestCredentials } from '../../../../test/helpers/user';
import { setupTest, Stage } from '../../../../test/setup';
import { releaseStage } from '../../../../test/setup-context-and-sql';
import { DbTables, SqlModelStatus } from '../../../config/types';
import { AUTHORIZATION_HEADER } from '../../../middlewares/authentication.middleware';
import { createPredictionSet } from '../../prediction-set/tests/helpers/prediction-helper';
import { createComment, createComments } from './helpers/comment-helper';
import { Comment } from '../models/comment.model';

describe('Comment e2e tests', () => {
  let stage: Stage;
  let cred: TestCredentials;
  let predictionSetId: number;

  beforeAll(async () => {
    stage = await setupTest();
    await createBaseRoles(stage.context);
    cred = await createBaseUsers(stage.context);
    const prediction = await createPredictionSet(stage.context);
    predictionSetId = prediction.id;
  });

  afterAll(async () => {
    await releaseStage(stage);
  });

  describe('Comment e2e tests', () => {
    afterEach(async () => {
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.COMMENT}\``);
    });

    describe('POST /comments - Create comment tests', () => {
      it('Should create a new comment', async () => {
        const body = {
          prediction_set_id: predictionSetId,
          content: 'Test comment 😍'
        };

        const res = await request(stage.http)
          .post('/comments')
          .send(body)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.CREATED);

        expect(res.body.data.content).toBe(body.content);
        expect(res.body.data.prediction_set_id).toBe(body.prediction_set_id);
        expect(res.body.data.user_id).toBe(cred.user.id);
      });

      it('Should create a reply comment', async () => {
        const parentComment = await createComment(stage.context, predictionSetId, cred.user.id);
        const body = {
          prediction_set_id: predictionSetId,
          parent_comment_id: parentComment.id,
          content: 'Test reply'
        };

        const res = await request(stage.http)
          .post('/comments')
          .send(body)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.CREATED);

        expect(res.body.data.content).toBe(body.content);
        expect(res.body.data.parent_comment_id).toBe(body.parent_comment_id);
      });
    });

    describe('GET /comments/prediction-set/:id - Get comments tests', () => {
      it('Should get comments', async () => {
        const comments = await createComments(3, stage.context, predictionSetId, cred.user.id);
        const res = await request(stage.http)
          .get(`/comments/prediction-set/${predictionSetId}`)
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.OK);

        expect(res.body.data.total).toBe(3);
        expect(res.body.data.items).toHaveLength(3);
        expect(res.body.data.items[0].content).toBe(comments[0].content);
        expect(res.body.data.items[1].content).toBe(comments[1].content);
        expect(res.body.data.items[2].content).toBe(comments[2].content);
      });

      it('Should not display deleted comments', async () => {
        const comments = await createComments(3, stage.context, predictionSetId, cred.user.id);
        await new Comment({ ...comments[0], status: SqlModelStatus.DELETED }, stage.context).update();
        const res = await request(stage.http)
          .get(`/comments/prediction-set/${predictionSetId}`)
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.OK);

        expect(res.body.data.total).toBe(3);
        expect(res.body.data.items).toHaveLength(3);
        expect(res.body.data.items[0].content).not.toBe(comments[0].content);
        expect(res.body.data.items[0].content).toBe('This comment has been deleted');
        expect(res.body.data.items[1].content).toBe(comments[1].content);
        expect(res.body.data.items[2].content).toBe(comments[2].content);
      });

      it('Should get comments with query', async () => {
        const comments = await createComments(3, stage.context, predictionSetId, cred.user.id);
        const res = await request(stage.http)
          .get(`/comments/prediction-set/${predictionSetId}`)
          .query({
            limit: 2,
            page: 1
          })
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.OK);

        expect(res.body.data.total).toBe(3);
        expect(res.body.data.items).toHaveLength(2);
        expect(res.body.data.items[0].content).toBe(comments[0].content);
        expect(res.body.data.items[1].content).toBe(comments[1].content);
      });
    });

    describe('PUT /comments/:id - Update comment tests', () => {
      it('Should update comment', async () => {
        const comment = await createComment(stage.context, predictionSetId, cred.user.id);
        const body = {
          content: 'Updated content'
        };

        const res = await request(stage.http)
          .put(`/comments/${comment.id}`)
          .send(body)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.OK);

        expect(res.body.data.id).toBe(comment.id);
        expect(res.body.data.content).toBe(body.content);
      });

      it('Should not update comment if user is not the owner', async () => {
        const comment = await createComment(stage.context, predictionSetId, cred.user.id);

        const body = {
          content: 'Updated content'
        };

        await request(stage.http)
          .put(`/comments/${comment.id}`)
          .send(body)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.user2Token)
          .expect(HttpStatus.FORBIDDEN);
      });
    });

    describe('DELETE /comments/:id - Delete comment tests', () => {
      it('Should delete comment', async () => {
        const comment = await createComment(stage.context, predictionSetId, cred.user.id);
        await request(stage.http)
          .delete(`/comments/${comment.id}`)
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.OK);

        const res = await stage.db.paramExecute(
          `
            SELECT * FROM \`${DbTables.COMMENT}\` 
            WHERE id = @commentId
          `,
          { commentId: comment.id }
        );

        expect(res[0].status).toBe(SqlModelStatus.DELETED);
      });

      it('Should not delete comment if user is not the owner', async () => {
        const comment = await createComment(stage.context, predictionSetId, cred.user.id);
        await request(stage.http)
          .delete(`/comments/${comment.id}`)
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.user2Token)
          .expect(HttpStatus.FORBIDDEN);
      });

      it('Should delete comment if user is admin', async () => {
        const comment = await createComment(stage.context, predictionSetId, cred.user.id);
        await request(stage.http)
          .delete(`/comments/${comment.id}`)
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.adminUserToken)
          .expect(HttpStatus.OK);

        const res = await stage.db.paramExecute(
          `
            SELECT * FROM \`${DbTables.COMMENT}\` 
            WHERE id = @commentId
          `,
          { commentId: comment.id }
        );
        expect(res[0].status).toBe(SqlModelStatus.DELETED);
      });
    });
  });
});
