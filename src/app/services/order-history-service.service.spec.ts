import { TestBed } from '@angular/core/testing';

import { OrderHistoryServiceService } from './order-history-service.service';

describe('OrderHistoryServiceService', () => {
  let service: OrderHistoryServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderHistoryServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
