import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  IPipeline,
  ICreatePipelineRequest,
} from '../interfaces';

type RawPipeline = {
  name: string;
  description: string;
  weghookId?: string;
  webhookUrl?: string;
};

@Injectable({ providedIn: 'root' })
export class PipelineService {
  constructor(
    private http: HttpClient,
    private api: ApiService,
  ) {}

  getUserPipelines(): Observable<IPipeline[]> {
    return this.api.get<RawPipeline[]>('/pipelines').pipe(
      map((pipelines) =>
        pipelines.map((pipeline) => ({
          name: pipeline.name,
          description: pipeline.description,
          webhookUrl: pipeline.webhookUrl ?? pipeline.weghookId ?? '',
        })),
      ),
    );
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
