import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Text,
  Title,
  List,
  Anchor,
  Code,
  Table,
  Blockquote,
  Divider,
  Box,
  Paper,
} from '@mantine/core';

export interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer = ({ content }: MarkdownViewerProps) => {
  // Clean up consecutive horizontal rules
  const cleanContent = content.replace(/(?:\r?\n\s*(?:[-*_]\s*){3,}){2,}/g, '\n\n---\n\n');

  return (
    <Box className="markdown-viewer" style={{ width: '100%' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }: any) => <Text mb="sm" size="sm" style={{ lineHeight: 1.6 }} {...props} />,
          h1: ({ node, ...props }: any) => <Title order={1} mt="xl" mb="md" fw={600} {...props} />,
          h2: ({ node, ...props }: any) => <Title order={2} mt="lg" mb="sm" fw={600} {...props} />,
          h3: ({ node, ...props }: any) => <Title order={3} mt="md" mb="sm" fw={500} {...props} />,
          h4: ({ node, ...props }: any) => <Title order={4} mt="md" mb="xs" fw={500} {...props} />,
          h5: ({ node, ...props }: any) => <Title order={5} mt="sm" mb="xs" fw={500} {...props} />,
          h6: ({ node, ...props }: any) => <Title order={6} mt="sm" mb="xs" fw={500} {...props} />,
          a: ({ node, ...props }: any) => <Anchor {...props} />,
          ul: ({ node, type, ...props }: any) => <List type="unordered" mb="sm" size="sm" {...props} />,
          ol: ({ node, type, ...props }: any) => <List type="ordered" mb="sm" size="sm" {...props} />,
          li: ({ node, ...props }: any) => <List.Item {...props} />,
          pre: ({ node, ...props }: any) => (
            <Paper withBorder p="sm" my="md" bg="dark.7" radius="md" style={{ overflowX: 'auto' }}>
              <Box component="pre" m={0} c="gray.0" fz="sm" style={{ fontFamily: 'monospace' }} {...props} />
            </Paper>
          ),
          code: ({ node, className, children, ...props }: any) => {
            const isBlock = /language-(\w+)/.test(className || '') || String(children).includes('\n');
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return <Code {...props}>{children}</Code>;
          },
          table: ({ node, ...props }: any) => (
            <Paper withBorder radius="md" my="md" style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover withTableBorder={false} withColumnBorders={false} {...props} />
            </Paper>
          ),
          thead: ({ node, ...props }: any) => <Table.Thead {...props} />,
          tbody: ({ node, ...props }: any) => <Table.Tbody {...props} />,
          tr: ({ node, ...props }: any) => <Table.Tr {...props} />,
          th: ({ node, ...props }: any) => <Table.Th fw={600} {...props} />,
          td: ({ node, ...props }: any) => <Table.Td {...props} />,
          blockquote: ({ node, ...props }: any) => (
            <Blockquote my="md" p="md" color="blue" radius="sm" {...props} />
          ),
          hr: ({ node, ...props }: any) => <Divider my="xl" {...props} />,
          strong: ({ node, ...props }: any) => <Text component="strong" fw={600} {...props} />,
          b: ({ node, ...props }: any) => <Text component="b" fw={600} {...props} />,
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </Box>
  );
};
