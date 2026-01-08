import { of } from 'rxjs';

import { SuccessInterceptor } from './success.interceptor';

describe('SuccessInterceptor', () => {
  let interceptor: SuccessInterceptor<any>;

  beforeEach(() => {
    interceptor = new SuccessInterceptor();
  });

  it('should wrap response in success envelope', (done) => {
    const mockContext: any = {
      switchToHttp: () => ({
        getResponse: () => ({ statusCode: 200 }),
      }),
    };
    const mockCallHandler: any = {
      handle: () => of({ name: 'Anshu' }),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        data: { name: 'Anshu' },
        timestamp: expect.any(String),
      });
      done();
    });
  });
});
