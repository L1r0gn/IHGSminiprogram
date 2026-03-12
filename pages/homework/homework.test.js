/**
 * Unit Tests for homework.js
 * Comprehensive test suite covering all functions, edge cases, and error scenarios
 */

// Mock dependencies
jest.mock('../../miniprogram_npm/@rojer/katex-mini/index.js', () => ({
  renderMathInText: jest.fn((content, options) => content)
}));

jest.mock('../../../app.js', () => ({
  globalData: {
    globalUrl: 'https://api.example.com'
  },
  handleTokenExpired: jest.fn()
}));

// Mock wx API
global.wx = {
  showToast: jest.fn(),
  hideLoading: jest.fn(),
  showLoading: jest.fn(),
  navigateBack: jest.fn(),
  getStorageSync: jest.fn(),
  request: jest.fn(),
  chooseMedia: jest.fn(),
  uploadFile: jest.fn(),
  showModal: jest.fn(),
  previewImage: jest.fn(),
  stopPullDownRefresh: jest.fn()
};

// Mock getApp
global.getApp = jest.fn(() => ({
  globalData: {
    globalUrl: 'https://api.example.com'
  },
  handleTokenExpired: jest.fn()
}));

const HomeworkPage = require('./homework');

describe('homework.js Unit Tests', () => {
  let pageInstance;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create a new page instance
    pageInstance = HomeworkPage;
    pageInstance.data = {
      assignmentId: null,
      mode: 'view',
      isLoading: true,
      homeworkDetail: {},
      resolvedProblemContent: '',
      options: [
        { id: 'A', selected: false },
        { id: 'B', selected: false },
        { id: 'C', selected: false },
        { id: 'D', selected: false }
      ],
      selectedAnswer: '',
      submitted_image_path: '',
      studentAnswerContent: '',
      submissionDetail: null,
      score: null,
      feedback: '',
      isOverdue: false,
      statusText: '',
      statusClass: ''
    };

    // Mock setData to update data object
    pageInstance.setData = jest.fn((newData) => {
      Object.assign(pageInstance.data, newData);
    });
  });

  describe('onLoad', () => {
    test('should handle missing id parameter', () => {
      pageInstance.onLoad({});
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '参数错误',
        icon: 'none',
        duration: 2000,
        complete: expect.any(Function)
      });
      expect(wx.navigateBack).toHaveBeenCalled();
    });

    test('should set assignmentId and default mode when only id is provided', () => {
      pageInstance.onLoad({ id: '123' });
      expect(pageInstance.data.assignmentId).toBe('123');
      expect(pageInstance.data.mode).toBe('view');
    });

    test('should set assignmentId and custom mode', () => {
      pageInstance.onLoad({ id: '456', mode: 'do' });
      expect(pageInstance.data.assignmentId).toBe('456');
      expect(pageInstance.data.mode).toBe('do');
    });

    test('should call loadData after setting data', () => {
      const loadDataSpy = jest.spyOn(pageInstance, 'loadData');
      pageInstance.onLoad({ id: '789', mode: 'grade' });
      expect(loadDataSpy).toHaveBeenCalled();
      loadDataSpy.mockRestore();
    });
  });

  describe('loadData', () => {
    test('should call loadHomeworkDetail when mode is do', () => {
      pageInstance.data.mode = 'do';
      const loadHomeworkDetailSpy = jest.spyOn(pageInstance, 'loadHomeworkDetail');
      pageInstance.loadData();
      expect(loadHomeworkDetailSpy).toHaveBeenCalled();
      loadHomeworkDetailSpy.mockRestore();
    });

    test('should call loadSubmissionDetail when mode is grade', () => {
      pageInstance.data.mode = 'grade';
      const loadSubmissionDetailSpy = jest.spyOn(pageInstance, 'loadSubmissionDetail');
      pageInstance.loadData();
      expect(loadSubmissionDetailSpy).toHaveBeenCalled();
      loadSubmissionDetailSpy.mockRestore();
    });

    test('should call loadHomeworkDetail when mode is view (default)', () => {
      pageInstance.data.mode = 'view';
      const loadHomeworkDetailSpy = jest.spyOn(pageInstance, 'loadHomeworkDetail');
      pageInstance.loadData();
      expect(loadHomeworkDetailSpy).toHaveBeenCalled();
      loadHomeworkDetailSpy.mockRestore();
    });
  });

  describe('loadHomeworkDetail', () => {
    const mockToken = 'test-token-123';

    beforeEach(() => {
      wx.getStorageSync.mockReturnValue(mockToken);
    });

    test('should handle missing token', () => {
      wx.getStorageSync.mockReturnValue(null);
      const app = getApp();
      pageInstance.loadHomeworkDetail();
      expect(app.handleTokenExpired).toHaveBeenCalled();
    });

    test('should load homework detail successfully', () => {
      const mockResponse = {
        statusCode: 200,
        data: {
          data: {
            title: 'Test Homework',
            problem_content: 'Test problem',
            problem_type: '选择',
            deadline: '2026-12-31 23:59:59',
            status: 'PENDING'
          }
        }
      };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadHomeworkDetail();

      expect(wx.showLoading).toHaveBeenCalledWith({ title: '加载中...' });
      expect(wx.hideLoading).toHaveBeenCalled();
      expect(pageInstance.data.homeworkDetail).toBe(mockResponse.data.data);
      expect(pageInstance.data.isLoading).toBe(false);
    });

    test('should handle overdue deadline', () => {
      const mockResponse = {
        statusCode: 200,
        data: {
          data: {
            title: 'Overdue Homework',
            problem_content: 'Test problem',
            problem_type: '选择',
            deadline: '2020-01-01 00:00:00',
            status: 'PENDING'
          }
        }
      };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadHomeworkDetail();

      expect(pageInstance.data.isOverdue).toBe(true);
      expect(pageInstance.data.statusText).toBe('已截止');
      expect(pageInstance.data.statusClass).toBe('overdue');
    });

    test('should handle 401 unauthorized response', () => {
      const mockResponse = {
        statusCode: 401
      };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadHomeworkDetail();

      const app = getApp();
      expect(app.handleTokenExpired).toHaveBeenCalled();
    });

    test('should handle other error status codes', () => {
      const mockResponse = {
        statusCode: 500
      };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadHomeworkDetail();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '加载失败',
        icon: 'none'
      });
    });

    test('should handle network failure', () => {
      wx.request.mockImplementation(({ fail }) => fail({}));

      pageInstance.loadHomeworkDetail();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '网络错误',
        icon: 'none'
      });
    });

    test('should populate student answer if exists', () => {
      const populateStudentAnswerSpy = jest.spyOn(pageInstance, 'populateStudentAnswer');
      const mockResponse = {
        statusCode: 200,
        data: {
          data: {
            title: 'Test Homework',
            problem_content: 'Test problem',
            problem_type: '选择',
            deadline: '2026-12-31 23:59:59',
            status: 'SUBMITTED',
            choose_answer: 'A'
          }
        }
      };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadHomeworkDetail();

      expect(populateStudentAnswerSpy).toHaveBeenCalledWith(mockResponse.data.data);
      populateStudentAnswerSpy.mockRestore();
    });
  });

  describe('loadSubmissionDetail', () => {
    const mockToken = 'test-token-456';

    beforeEach(() => {
      wx.getStorageSync.mockReturnValue(mockToken);
    });

    test('should load submission detail successfully', () => {
      const mockResponse = {
        statusCode: 200,
        data: [
          {
            assignment_title: 'Test Assignment',
            question_content: 'Test question',
            question_type: '选择',
            deadline: '2026-12-31',
            score: 85,
            feedback: 'Good job',
            submitted_answer: 'A'
          }
        ]
      };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadSubmissionDetail();

      expect(pageInstance.data.submissionDetail).toBe(mockResponse.data[0]);
      expect(pageInstance.data.score).toBe(85);
      expect(pageInstance.data.feedback).toBe('Good job');
      expect(pageInstance.data.statusText).toBe('已批改');
      expect(pageInstance.data.statusClass).toBe('graded');
    });

    test('should handle empty submission list', () => {
      const mockResponse = {
        statusCode: 200,
        data: []
      };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadSubmissionDetail();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '暂无提交记录',
        icon: 'none'
      });
      expect(wx.navigateBack).toHaveBeenCalled();
    });

    test('should handle network failure', () => {
      wx.request.mockImplementation(({ fail }) => fail({}));

      pageInstance.loadSubmissionDetail();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '网络错误',
        icon: 'none'
      });
    });

    test('should populate submitted image if exists', () => {
      const mockResponse = {
        statusCode: 200,
        data: [
          {
            assignment_title: 'Test Assignment',
            question_content: 'Test question',
            question_type: '简答',
            deadline: '2026-12-31',
            score: 90,
            feedback: 'Excellent',
            submitted_image: 'https://example.com/image.jpg'
          }
        ]
      };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadSubmissionDetail();

      expect(pageInstance.data.submitted_image_path).toBe('https://example.com/image.jpg');
    });

    test('should populate answer from submission', () => {
      const populateAnswerFromSubmissionSpy = jest.spyOn(pageInstance, 'populateAnswerFromSubmission');
      const mockResponse = {
        statusCode: 200,
        data: [
          {
            assignment_title: 'Test Assignment',
            question_content: 'Test question',
            question_type: '选择',
            submitted_answer: 'B'
          }
        ]
      };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadSubmissionDetail();

      expect(populateAnswerFromSubmissionSpy).toHaveBeenCalledWith(mockResponse.data[0]);
      populateAnswerFromSubmissionSpy.mockRestore();
    });
  });

  describe('formatStatus', () => {
    test('should format PENDING status when not overdue', () => {
      const detail = { status: 'PENDING' };
      const result = pageInstance.formatStatus(detail, false);
      expect(result.text).toBe('待完成');
      expect(result.class).toBe('pending');
    });

    test('should format PENDING status when overdue', () => {
      const detail = { status: 'PENDING' };
      const result = pageInstance.formatStatus(detail, true);
      expect(result.text).toBe('已截止');
      expect(result.class).toBe('overdue');
    });

    test('should format SUBMITTED status', () => {
      const detail = { status: 'SUBMITTED' };
      const result = pageInstance.formatStatus(detail, false);
      expect(result.text).toBe('已提交');
      expect(result.class).toBe('submitted');
    });

    test('should format GRADED status', () => {
      const detail = { status: 'GRADED' };
      const result = pageInstance.formatStatus(detail, false);
      expect(result.text).toBe('已批改');
      expect(result.class).toBe('graded');
    });

    test('should format ACCEPTED status', () => {
      const detail = { status: 'ACCEPTED' };
      const result = pageInstance.formatStatus(detail, false);
      expect(result.text).toBe('已完成');
      expect(result.class).toBe('accepted');
    });

    test('should format WRONG_ANSWER status', () => {
      const detail = { status: 'WRONG_ANSWER' };
      const result = pageInstance.formatStatus(detail, false);
      expect(result.text).toBe('需修改');
      expect(result.class).toBe('wrong');
    });

    test('should handle unknown status', () => {
      const detail = { status: 'UNKNOWN' };
      const result = pageInstance.formatStatus(detail, false);
      expect(result.text).toBe('UNKNOWN');
      expect(result.class).toBe('default');
    });

    test('should handle undefined status', () => {
      const detail = { status: undefined };
      const result = pageInstance.formatStatus(detail, false);
      expect(result.text).toBe('未知');
      expect(result.class).toBe('default');
    });
  });

  describe('populateStudentAnswer', () => {
    test('should populate choice answer', () => {
      const detail = {
        problem_type: '选择',
        choose_answer: 'C'
      };
      pageInstance.populateStudentAnswer(detail);
      expect(pageInstance.data.selectedAnswer).toBe('C');
      expect(pageInstance.data.options[2].selected).toBe(true);
      expect(pageInstance.data.options[0].selected).toBe(false);
    });

    test('should populate image answer', () => {
      const detail = {
        problem_type: '图片',
        choose_answer: 'https://example.com/image.jpg'
      };
      pageInstance.populateStudentAnswer(detail);
      expect(pageInstance.data.submitted_image_path).toBe('https://example.com/image.jpg');
    });

    test('should populate photo answer', () => {
      const detail = {
        problem_type: '拍照',
        choose_answer: 'https://example.com/photo.jpg'
      };
      pageInstance.populateStudentAnswer(detail);
      expect(pageInstance.data.submitted_image_path).toBe('https://example.com/photo.jpg');
    });

    test('should populate subjective answer', () => {
      const detail = {
        problem_type: '主观',
        student_answer_content: '这是我的答案'
      };
      pageInstance.populateStudentAnswer(detail);
      expect(pageInstance.data.studentAnswerContent).toBe('这是我的答案');
    });

    test('should populate short answer', () => {
      const detail = {
        problem_type: '简答',
        student_answer_content: '简答题答案'
      };
      pageInstance.populateStudentAnswer(detail);
      expect(pageInstance.data.studentAnswerContent).toBe('简答题答案');
    });

    test('should populate fill-in-blank answer', () => {
      const detail = {
        problem_type: '填空',
        student_answer_content: '填空题答案'
      };
      pageInstance.populateStudentAnswer(detail);
      expect(pageInstance.data.studentAnswerContent).toBe('填空题答案');
    });

    test('should handle empty answer', () => {
      const detail = {
        problem_type: '选择',
        choose_answer: ''
      };
      pageInstance.populateStudentAnswer(detail);
      expect(pageInstance.data.selectedAnswer).toBe('');
    });

    test('should handle missing answer field', () => {
      const detail = {
        problem_type: '选择'
      };
      pageInstance.populateStudentAnswer(detail);
      expect(pageInstance.data.selectedAnswer).toBe('');
    });
  });

  describe('populateAnswerFromSubmission', () => {
    test('should populate choice answer from submission', () => {
      const submission = {
        question_type: '选择',
        submitted_answer: 'B'
      };
      pageInstance.populateAnswerFromSubmission(submission);
      expect(pageInstance.data.selectedAnswer).toBe('B');
      expect(pageInstance.data.options[1].selected).toBe(true);
    });

    test('should populate choose_answer from submission', () => {
      const submission = {
        question_type: '选择',
        choose_answer: 'D'
      };
      pageInstance.populateAnswerFromSubmission(submission);
      expect(pageInstance.data.selectedAnswer).toBe('D');
      expect(pageInstance.data.options[3].selected).toBe(true);
    });

    test('should populate subjective answer from submission', () => {
      const submission = {
        question_type: '主观',
        submitted_answer: '主观题答案'
      };
      pageInstance.populateAnswerFromSubmission(submission);
      expect(pageInstance.data.studentAnswerContent).toBe('主观题答案');
    });

    test('should populate short answer from submission', () => {
      const submission = {
        question_type: '简答',
        submitted_answer: '简答题答案'
      };
      pageInstance.populateAnswerFromSubmission(submission);
      expect(pageInstance.data.studentAnswerContent).toBe('简答题答案');
    });

    test('should populate fill-in-blank answer from submission', () => {
      const submission = {
        question_type: '填空',
        submitted_answer: '填空题答案'
      };
      pageInstance.populateAnswerFromSubmission(submission);
      expect(pageInstance.data.studentAnswerContent).toBe('填空题答案');
    });

    test('should handle empty submission answer', () => {
      const submission = {
        question_type: '选择',
        submitted_answer: ''
      };
      pageInstance.populateAnswerFromSubmission(submission);
      expect(pageInstance.data.selectedAnswer).toBe('');
    });

    test('should handle missing question_type', () => {
      const submission = {
        submitted_answer: 'Test answer'
      };
      pageInstance.populateAnswerFromSubmission(submission);
      expect(pageInstance.data.studentAnswerContent).toBe('Test answer');
    });
  });

  describe('selectAnswer', () => {
    test('should select answer in do mode', () => {
      pageInstance.data.mode = 'do';
      const event = { currentTarget: { dataset: { id: 'C' } } };
      pageInstance.selectAnswer(event);
      expect(pageInstance.data.selectedAnswer).toBe('C');
      expect(pageInstance.data.options[2].selected).toBe(true);
      expect(pageInstance.data.options[0].selected).toBe(false);
    });

    test('should not select answer in view mode', () => {
      pageInstance.data.mode = 'view';
      const event = { currentTarget: { dataset: { id: 'A' } } };
      pageInstance.selectAnswer(event);
      expect(pageInstance.data.selectedAnswer).toBe('');
    });

    test('should not select answer in grade mode', () => {
      pageInstance.data.mode = 'grade';
      const event = { currentTarget: { dataset: { id: 'B' } } };
      pageInstance.selectAnswer(event);
      expect(pageInstance.data.selectedAnswer).toBe('');
    });

    test('should handle multiple selections correctly', () => {
      pageInstance.data.mode = 'do';
      pageInstance.selectAnswer({ currentTarget: { dataset: { id: 'A' } } });
      expect(pageInstance.data.options[0].selected).toBe(true);
      expect(pageInstance.data.options[1].selected).toBe(false);

      pageInstance.selectAnswer({ currentTarget: { dataset: { id: 'B' } } });
      expect(pageInstance.data.options[0].selected).toBe(false);
      expect(pageInstance.data.options[1].selected).toBe(true);
    });
  });

  describe('uploadImage', () => {
    test('should upload image in do mode', () => {
      pageInstance.data.mode = 'do';
      const mockTempFiles = [{ tempFilePath: 'temp://image.jpg' }];
      wx.chooseMedia.mockImplementation(({ success }) => success({ tempFiles: mockTempFiles }));

      pageInstance.uploadImage();

      expect(wx.chooseMedia).toHaveBeenCalledWith({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        camera: 'back',
        success: expect.any(Function)
      });
      expect(pageInstance.data.submitted_image_path).toBe('temp://image.jpg');
    });

    test('should not upload image in view mode', () => {
      pageInstance.data.mode = 'view';
      pageInstance.uploadImage();
      expect(wx.chooseMedia).not.toHaveBeenCalled();
    });

    test('should not upload image in grade mode', () => {
      pageInstance.data.mode = 'grade';
      pageInstance.uploadImage();
      expect(wx.chooseMedia).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      pageInstance.data.homeworkDetail = {
        problem_type: '选择',
        status: 'PENDING',
        problem_id: '123',
        assignment_id: '456'
      };
    });

    test('should not submit in view mode', () => {
      pageInstance.data.mode = 'view';
      pageInstance.onSubmit();
      expect(wx.showModal).not.toHaveBeenCalled();
    });

    test('should not submit in grade mode', () => {
      pageInstance.data.mode = 'grade';
      pageInstance.onSubmit();
      expect(wx.showModal).not.toHaveBeenCalled();
    });

    test('should show error when homework is overdue', () => {
      pageInstance.data.mode = 'do';
      pageInstance.data.isOverdue = true;
      pageInstance.onSubmit();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '已超过截止时间，无法提交',
        icon: 'none'
      });
    });

    test('should show error when homework already submitted', () => {
      pageInstance.data.mode = 'do';
      pageInstance.data.homeworkDetail.status = 'SUBMITTED';
      pageInstance.onSubmit();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '作业已提交，无法重复提交',
        icon: 'none'
      });
    });

    test('should show error when no answer selected for choice question', () => {
      pageInstance.data.mode = 'do';
      pageInstance.data.selectedAnswer = '';
      pageInstance.onSubmit();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请选择一个选项',
        icon: 'none'
      });
    });

    test('should show confirmation modal for valid choice answer', () => {
      pageInstance.data.mode = 'do';
      pageInstance.data.selectedAnswer = 'A';
      pageInstance.onSubmit();
      expect(wx.showModal).toHaveBeenCalledWith({
        title: '确认提交',
        content: '提交后将无法修改,确定要提交吗?',
        success: expect.any(Function)
      });
    });

    test('should show error when no image uploaded for short answer question', () => {
      pageInstance.data.homeworkDetail.problem_type = '简答';
      pageInstance.data.mode = 'do';
      pageInstance.data.submitted_image_path = '';
      pageInstance.onSubmit();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请上传图片',
        icon: 'none'
      });
    });

    test('should show confirmation modal for valid image answer', () => {
      pageInstance.data.homeworkDetail.problem_type = '简答';
      pageInstance.data.mode = 'do';
      pageInstance.data.submitted_image_path = 'temp://image.jpg';
      pageInstance.onSubmit();
      expect(wx.showModal).toHaveBeenCalledWith({
        title: '确认提交',
        content: '提交后将无法修改,确定要提交吗?',
        success: expect.any(Function)
      });
    });

    test('should perform submit when modal confirmed', () => {
      pageInstance.data.mode = 'do';
      pageInstance.data.selectedAnswer = 'B';
      const performSubmitSpy = jest.spyOn(pageInstance, 'performSubmit');

      wx.showModal.mockImplementation(({ success }) => success({ confirm: true }));
      pageInstance.onSubmit();

      expect(performSubmitSpy).toHaveBeenCalled();
      performSubmitSpy.mockRestore();
    });

    test('should not perform submit when modal cancelled', () => {
      pageInstance.data.mode = 'do';
      pageInstance.data.selectedAnswer = 'B';
      const performSubmitSpy = jest.spyOn(pageInstance, 'performSubmit');

      wx.showModal.mockImplementation(({ success }) => success({ confirm: false }));
      pageInstance.onSubmit();

      expect(performSubmitSpy).not.toHaveBeenCalled();
      performSubmitSpy.mockRestore();
    });
  });

  describe('performSubmit', () => {
    beforeEach(() => {
      pageInstance.data.homeworkDetail = {
        problem_type: '选择',
        problem_id: '123',
        assignment_id: '456'
      };
    });

    test('should show error when token is missing', () => {
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'accessToken') return null;
        if (key === 'userId') return 'user123';
        return null;
      });
      pageInstance.performSubmit();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请先登录',
        icon: 'none'
      });
    });

    test('should show error when userId is missing', () => {
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'accessToken') return 'token123';
        if (key === 'userId') return null;
        return null;
      });
      pageInstance.performSubmit();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请先登录',
        icon: 'none'
      });
    });

    test('should call submitChoiceAnswer for choice question', () => {
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'accessToken') return 'token123';
        if (key === 'userId') return 'user123';
        return null;
      });
      const submitChoiceAnswerSpy = jest.spyOn(pageInstance, 'submitChoiceAnswer');
      pageInstance.data.homeworkDetail.problem_type = '选择';
      pageInstance.performSubmit();
      expect(submitChoiceAnswerSpy).toHaveBeenCalledWith('token123', 'user123');
      submitChoiceAnswerSpy.mockRestore();
    });

    test('should call submitImageAnswer for short answer question', () => {
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'accessToken') return 'token123';
        if (key === 'userId') return 'user123';
        return null;
      });
      const submitImageAnswerSpy = jest.spyOn(pageInstance, 'submitImageAnswer');
      pageInstance.data.homeworkDetail.problem_type = '简答';
      pageInstance.performSubmit();
      expect(submitImageAnswerSpy).toHaveBeenCalledWith('token123', 'user123');
      submitImageAnswerSpy.mockRestore();
    });

    test('should call submitImageAnswer for fill-in-blank question', () => {
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'accessToken') return 'token123';
        if (key === 'userId') return 'user123';
        return null;
      });
      const submitImageAnswerSpy = jest.spyOn(pageInstance, 'submitImageAnswer');
      pageInstance.data.homeworkDetail.problem_type = '填空';
      pageInstance.performSubmit();
      expect(submitImageAnswerSpy).toHaveBeenCalledWith('token123', 'user123');
      submitImageAnswerSpy.mockRestore();
    });
  });

  describe('submitChoiceAnswer', () => {
    const mockToken = 'test-token';
    const mockUserId = 'user-123';

    beforeEach(() => {
      pageInstance.data.homeworkDetail = {
        problem_id: 'prob-123',
        assignment_id: 'assign-123'
      };
      pageInstance.data.selectedAnswer = 'A';
    });

    test('should show error when token is missing', () => {
      pageInstance.submitChoiceAnswer(null, mockUserId);
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '登录信息无效，请重新登录',
        icon: 'none'
      });
      expect(wx.request).not.toHaveBeenCalled();
    });

    test('should show error when userId is missing', () => {
      pageInstance.submitChoiceAnswer(mockToken, null);
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '登录信息无效，请重新登录',
        icon: 'none'
      });
      expect(wx.request).not.toHaveBeenCalled();
    });

    test('should show error when problem_id is missing', () => {
      pageInstance.data.homeworkDetail.problem_id = null;
      pageInstance.submitChoiceAnswer(mockToken, mockUserId);
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请先选择答案',
        icon: 'none'
      });
      expect(wx.request).not.toHaveBeenCalled();
    });

    test('should show error when selectedAnswer is missing', () => {
      pageInstance.data.selectedAnswer = '';
      pageInstance.submitChoiceAnswer(mockToken, mockUserId);
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请先选择答案',
        icon: 'none'
      });
      expect(wx.request).not.toHaveBeenCalled();
    });

    test('should submit choice answer successfully', () => {
      const mockResponse = { statusCode: 200 };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.submitChoiceAnswer(mockToken, mockUserId);

      expect(wx.showLoading).toHaveBeenCalledWith({ title: '提交中...' });
      expect(wx.request).toHaveBeenCalledWith({
        url: 'https://api.example.com/grading/wx/submit/',
        method: 'POST',
        header: {
          Authorization: 'Bearer test-token'
        },
        data: expect.objectContaining({
          from: 'assignment',
          assignment_id: 'assign-123',
          questionId: 'prob-123',
          selectedAnswer: 'A',
          userId: 'user-123'
        })
      });
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '提交成功',
        icon: 'success'
      });
      expect(wx.navigateBack).toHaveBeenCalled();
    });

    test('should handle 401 unauthorized response', () => {
      const mockResponse = { statusCode: 401 };
      wx.request.mockImplementation(({ success }) => success(mockResponse));
      const app = getApp();

      pageInstance.submitChoiceAnswer(mockToken, mockUserId);

      expect(app.handleTokenExpired).toHaveBeenCalled();
    });

    test('should handle error response', () => {
      const mockResponse = {
        statusCode: 400,
        data: { error: 'Invalid answer' }
      };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.submitChoiceAnswer(mockToken, mockUserId);

      expect(wx.showToast).toHaveBeenCalledWith({
        title: 'Invalid answer',
        icon: 'none'
      });
    });

    test('should handle network failure', () => {
      wx.request.mockImplementation(({ fail }) => fail({}));

      pageInstance.submitChoiceAnswer(mockToken, mockUserId);

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '网络错误，请重试',
        icon: 'none'
      });
    });

    test('should handle response without error message', () => {
      const mockResponse = { statusCode: 500 };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.submitChoiceAnswer(mockToken, mockUserId);

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '提交失败',
        icon: 'none'
      });
    });
  });

  describe('submitImageAnswer', () => {
    const mockToken = 'test-token';
    const mockUserId = 'user-456';

    beforeEach(() => {
      pageInstance.data.homeworkDetail = {
        problem_id: 'prob-456'
      };
      pageInstance.data.submitted_image_path = 'temp://image.jpg';
    });

    test('should show error when image path is missing', () => {
      pageInstance.data.submitted_image_path = '';
      pageInstance.submitImageAnswer(mockToken, mockUserId);
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请先上传答案图片',
        icon: 'none'
      });
      expect(wx.uploadFile).not.toHaveBeenCalled();
    });

    test('should submit image answer successfully', () => {
      const mockResponse = {
        statusCode: 200,
        data: JSON.stringify({ success: true })
      };
      wx.uploadFile.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.submitImageAnswer(mockToken, mockUserId);

      expect(wx.showLoading).toHaveBeenCalledWith({ title: '提交中...' });
      expect(wx.uploadFile).toHaveBeenCalledWith({
        url: 'https://api.example.com/grading/wx/submit/',
        filePath: 'temp://image.jpg',
        name: 'submitted_image',
        header: {
          Authorization: 'Bearer test-token'
        },
        formData: {
          questionId: 'prob-456',
          userId: 'user-456'
        },
        success: expect.any(Function)
      });
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '提交成功',
        icon: 'success'
      });
      expect(wx.navigateBack).toHaveBeenCalled();
    });

    test('should handle error response', () => {
      const mockResponse = {
        statusCode: 400,
        data: JSON.stringify({ error: 'Image too large' })
      };
      wx.uploadFile.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.submitImageAnswer(mockToken, mockUserId);

      expect(wx.showToast).toHaveBeenCalledWith({
        title: 'Image too large',
        icon: 'none'
      });
    });

    test('should handle network failure', () => {
      wx.uploadFile.mockImplementation(({ fail }) => fail({}));

      pageInstance.submitImageAnswer(mockToken, mockUserId);

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '网络错误',
        icon: 'none'
      });
    });

    test('should handle invalid JSON response', () => {
      const mockResponse = {
        statusCode: 200,
        data: 'invalid json'
      };
      wx.uploadFile.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.submitImageAnswer(mockToken, mockUserId);

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '服务器返回格式错误',
        icon: 'none'
      });
    });

    test('should handle response without error message', () => {
      const mockResponse = {
        statusCode: 500,
        data: JSON.stringify({})
      };
      wx.uploadFile.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.submitImageAnswer(mockToken, mockUserId);

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '提交失败',
        icon: 'none'
      });
    });
  });

  describe('previewImage', () => {
    test('should preview image when path exists', () => {
      pageInstance.data.submitted_image_path = 'https://example.com/image.jpg';
      pageInstance.previewImage();
      expect(wx.previewImage).toHaveBeenCalledWith({
        urls: ['https://example.com/image.jpg']
      });
    });

    test('should not preview when image path is empty', () => {
      pageInstance.data.submitted_image_path = '';
      pageInstance.previewImage();
      expect(wx.previewImage).not.toHaveBeenCalled();
    });

    test('should not preview when image path is null', () => {
      pageInstance.data.submitted_image_path = null;
      pageInstance.previewImage();
      expect(wx.previewImage).not.toHaveBeenCalled();
    });

    test('should not preview when image path is undefined', () => {
      pageInstance.data.submitted_image_path = undefined;
      pageInstance.previewImage();
      expect(wx.previewImage).not.toHaveBeenCalled();
    });
  });

  describe('parseLatexContent', () => {
    test('should return original content when content is empty', () => {
      const result = pageInstance.parseLatexContent('');
      expect(result).toBe('');
    });

    test('should return original content when content is null', () => {
      const result = pageInstance.parseLatexContent(null);
      expect(result).toBe(null);
    });

    test('should return original content when content is undefined', () => {
      const result = pageInstance.parseLatexContent(undefined);
      expect(result).toBe(undefined);
    });

    test('should parse LaTeX content successfully', () => {
      const katexLib = require('../../miniprogram_npm/@rojer/katex-mini/index.js');
      katexLib.renderMathInText.mockReturnValue(['<span>parsed</span>']);

      const result = pageInstance.parseLatexContent('Test $$x^2$$ formula');
      expect(katexLib.renderMathInText).toHaveBeenCalledWith('Test $$x^2$$ formula', expect.any(Object));
    });

    test('should return original content on parse error', () => {
      const katexLib = require('../../miniprogram_npm/@rojer/katex-mini/index.js');
      katexLib.renderMathInText.mockImplementation(() => {
        throw new Error('Parse error');
      });

      const result = pageInstance.parseLatexContent('Test content');
      expect(result).toBe('Test content');
    });

    test('should pass correct options to katex', () => {
      const katexLib = require('../../miniprogram_npm/@rojer/katex-mini/index.js');
      katexLib.renderMathInText.mockReturnValue(['<span>parsed</span>']);

      pageInstance.parseLatexContent('Test $$x^2$$');

      expect(katexLib.renderMathInText).toHaveBeenCalledWith('Test $$x^2$$', {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    });
  });

  describe('onPullDownRefresh', () => {
    test('should reload data and stop pull down refresh', () => {
      const loadDataSpy = jest.spyOn(pageInstance, 'loadData');
      pageInstance.onPullDownRefresh();
      expect(loadDataSpy).toHaveBeenCalled();
      expect(wx.stopPullDownRefresh).toHaveBeenCalled();
      loadDataSpy.mockRestore();
    });
  });

  describe('Edge Cases and Integration', () => {
    test('should handle rapid setData calls', () => {
      pageInstance.data.mode = 'do';
      pageInstance.selectAnswer({ currentTarget: { dataset: { id: 'A' } } });
      pageInstance.selectAnswer({ currentTarget: { dataset: { id: 'B' } } });
      pageInstance.selectAnswer({ currentTarget: { dataset: { id: 'C' } } });

      expect(pageInstance.data.selectedAnswer).toBe('C');
      expect(pageInstance.data.options[2].selected).toBe(true);
      expect(pageInstance.data.options[0].selected).toBe(false);
    });

    test('should handle empty assignment list in loadSubmissionDetail', () => {
      wx.getStorageSync.mockReturnValue('token');
      const mockResponse = { statusCode: 200, data: [] };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadSubmissionDetail();
      expect(pageInstance.data.submissionDetail).toBeNull();
    });

    test('should handle malformed response data', () => {
      wx.getStorageSync.mockReturnValue('token');
      const mockResponse = { statusCode: 200, data: 'invalid' };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadSubmissionDetail();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '暂无提交记录',
        icon: 'none'
      });
    });

    test('should handle null response data', () => {
      wx.getStorageSync.mockReturnValue('token');
      const mockResponse = { statusCode: 200, data: null };
      wx.request.mockImplementation(({ success }) => success(mockResponse));

      pageInstance.loadSubmissionDetail();
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '暂无提交记录',
        icon: 'none'
      });
    });
  });
});
