import { Injectable, Logger } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { IndexDocumentDto } from "../dto/index-document.dto";
import { SearchDocument } from "../interfaces";
import { SearchQueryDto } from "../dto/search-query.dto";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class SearchGatewayService {
  private readonly logger = new Logger(SearchGatewayService.name);

  constructor(private readonly httpGateway: GatewayHttpService) { }

  async indexSearchDocument(dto: IndexDocumentDto) {
    return this.httpGateway.post<SearchDocument>(
      this.httpGateway.composeServiceUrl(DownstreamApps.SEARCH, '/index'),
      dto,
      'search service',
    );
  }

  async seedSearchData() {
    return this.httpGateway.post<void>(
      this.httpGateway.composeServiceUrl(DownstreamApps.SEARCH, '/seed'),
      {},
      'search service',
    );
  }

  async search(dto: SearchQueryDto) {
    return this.httpGateway.post<SearchDocument[]>(
      this.httpGateway.composeServiceUrl(DownstreamApps.SEARCH, '/search'),
      dto,
      'search service',
    );
  }

  async getDocument(id: string) {
    return this.httpGateway.get<SearchDocument>(
      this.httpGateway.composeServiceUrl(DownstreamApps.SEARCH, `/documents/${id}`),
      'search service',
    );
  }
}