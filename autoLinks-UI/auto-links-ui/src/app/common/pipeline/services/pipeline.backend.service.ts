import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  IPipeline,
  ICreatePipelineRequest,
  IPipelineJob,
  ISubscriber,
} from '../interfaces';

type RawSubscriber = ISubscriber;

type RawPipeline = {
  id: string;
  name: string;
  description: string;
  weghookId?: string;
  webhookUrl?: string;
  subscribers?: RawSubscriber[];
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
          id: pipeline.id,
          name: pipeline.name,
          description: pipeline.description,
          webhookUrl: pipeline.webhookUrl ?? pipeline.weghookId ?? '',
          subscribers: pipeline.subscribers ?? [],
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

  updatePipeline(
    pipelineId: string,
    _data: ICreatePipelineRequest,
  ): Observable<IPipeline> {
    return this.api.put<IPipeline>(`/pipelines/${pipelineId}`, _data);
  }

  deletePipeline(pipelineId: string): Observable<object> {
    return this.api.delete<object>(`/pipelines/${pipelineId}`);
  }

  getPipelineJobs(pipelineId: string): Observable<IPipelineJob[]> {
    return this.api.get<IPipelineJob[]>(`/pipelines/${pipelineId}/jobs`).pipe(
      map((jobs) =>
        jobs.map((job) => ({
          ...job,
          createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : '',
        })),
      ),
    );
  }

  triggerWebhook(_webhookUrl: string, _payload: object): Observable<object> {
    return this.api.post<object>(_webhookUrl, _payload);
  }
}
