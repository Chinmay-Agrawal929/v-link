import fs from 'fs';
let code = fs.readFileSync('src/tabs/NetworkTab.tsx', 'utf8');

const importRegex = /import\s+{.*}\s+from\s+'@tanstack\/react-query';/;
if (importRegex.test(code)) {
    code = code.replace(/import\s+{(.*)}\s+from\s+'@tanstack\/react-query';/, "import {$1, useMutation} from '@tanstack/react-query';");
} else {
    code = "import { useMutation, useQueryClient } from '@tanstack/react-query';\n" + code;
}

// if useQueryClient is not there, add it
if (code.indexOf('useQueryClient') === -1) {
    code = code.replace(/import\s+{(.*)}\s+from\s+'@tanstack\/react-query';/, "import {$1, useQueryClient} from '@tanstack/react-query';");
}


// Replace handleConnect
const newHandleConnect = `
  const queryClient = useQueryClient();
  const connectMutation = useMutation({
    mutationFn: async (userId: string) => {
      // In a real app, this would create a connection request doc in Firestore
      // For now, we simulate a small network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return userId;
    },
    onMutate: async (userId) => {
      // Cancel any outgoing refetches
      // await queryClient.cancelQueries({ queryKey: ['network'] })
      // Optimistically update to pending state
      setPendingConnects(prev => [...prev, userId]);
      return { previousConnects: pendingConnects };
    },
    onError: (err, userId, context) => {
      if (context?.previousConnects) {
        setPendingConnects(context.previousConnects);
      }
    },
    onSettled: () => {
      // queryClient.invalidateQueries({ queryKey: ['network'] })
    }
  });

  const handleConnect = async (userId: string) => {
    connectMutation.mutate(userId);
  };
`;

const handleConnectStart = code.indexOf('const handleConnect = async');
const handleConnectEnd = code.indexOf('};', handleConnectStart) + 2;

if (handleConnectStart !== -1) {
    code = code.substring(0, handleConnectStart) + newHandleConnect + code.substring(handleConnectEnd);
}

fs.writeFileSync('src/tabs/NetworkTab.tsx', code);
