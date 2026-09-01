const fs = require('fs');
let code = fs.readFileSync('src/components/CreatePostModal.tsx', 'utf8');
code = code.replace(
  "const { draftPostContent, setDraftPostContent } = useAppStore();\n  const [content, setContent] = useState(draftPostContent);",
  `const { draftPostContent, setDraftPostContent } = useAppStore();
  const [content, setContent] = useState('');
  
  React.useEffect(() => {
    if (isCreateModalOpen && draftPostContent) {
      setContent(draftPostContent);
      setDraftPostContent('');
    }
  }, [isCreateModalOpen, draftPostContent]);`
);
fs.writeFileSync('src/components/CreatePostModal.tsx', code);
