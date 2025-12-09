import { Injectable, NotFoundException } from '@nestjs/common';
import { IndexDocumentDto } from './dto/index-document.dto';
import { SearchQueryDto } from './dto/search-query.dto';

interface SearchDocument {
  id: string;
  title: string;
  description?: string;
  tags: string[];
}

@Injectable()
export class AppService {
  private documents: SearchDocument[] = [];

  health() {
    return {
      service: 'search',
      status: 'ok',
      documents: this.documents.length,
      timestamp: new Date().toISOString(),
    };
  }

  indexDocument(dto: IndexDocumentDto): SearchDocument {
    const existingIndex = this.documents.findIndex((doc) => doc.id === dto.id);
    const doc: SearchDocument = {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      tags: dto.tags ?? [],
    };
    if (existingIndex >= 0) {
      this.documents[existingIndex] = doc;
    } else {
      this.documents.push(doc);
    }
    return doc;
  }

  search(dto: SearchQueryDto): SearchDocument[] {
    const q = dto.query.toLowerCase();
    const tags = dto.tags?.map((t) => t.toLowerCase()) ?? [];
    return this.documents
      .map((doc) => ({
        doc,
        score: this.score(doc, q, tags),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.doc);
  }

  getDocument(id: string): SearchDocument {
    const doc = this.documents.find((d) => d.id === id);
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  private score(doc: SearchDocument, query: string, tags: string[]): number {
    let score = 0;
    const haystack = `${doc.title} ${doc.description ?? ''}`.toLowerCase();
    if (haystack.includes(query)) {
      score += 2;
    }
    if (doc.tags.some((t) => t.toLowerCase().includes(query))) {
      score += 1;
    }
    if (tags.length && tags.some((t) => doc.tags.map((d) => d.toLowerCase()).includes(t))) {
      score += 1;
    }
    return score;
  }
}
