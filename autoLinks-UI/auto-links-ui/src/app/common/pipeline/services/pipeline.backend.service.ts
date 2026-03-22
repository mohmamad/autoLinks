import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  IPipeline,
  ICreatePipelineRequest,
} from '../interfaces';

@Injectable({ providedIn: 'root' })
export class PipelineService {
  constructor(
    private http: HttpClient,
    private api: ApiService,
  ) {}

  getAllPipelines(): Observable<IPipeline[]> {
    return this.api.get<IPipeline[]>('/pipelines');
  }

  createDiagram(_message: string): Observable<string> {
    return this.api.postText('/pipelines/diagram', { message: _message });
  }

  createPipeline(_data: ICreatePipelineRequest): Observable<string> {
    return this.api.postText('/pipelines', _data);
  }

  triggerWebhook(_webhookUrl: string, _payload: object): Observable<object> {
    return this.api.post<object>(_webhookUrl, _payload);
  }
}
