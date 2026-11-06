use std::collections::VecDeque;

/// A thread-safe bounded circular buffer for replaying terminal screen history.
#[derive(Debug, Clone)]
pub struct RingBuffer {
    capacity: usize,
    buffer: VecDeque<u8>,
}

impl RingBuffer {
    pub fn new(capacity: usize) -> Self {
        Self {
            capacity,
            buffer: VecDeque::with_capacity(capacity.min(65536)),
        }
    }

    pub fn extend(&mut self, data: &[u8]) {
        if data.len() >= self.capacity {
            self.buffer.clear();
            let start = data.len() - self.capacity;
            self.buffer.extend(data[start..].iter().copied());
            return;
        }

        let overflow = (self.buffer.len() + data.len()).saturating_sub(self.capacity);
        if overflow > 0 {
            self.buffer.drain(0..overflow);
        }
        self.buffer.extend(data.iter().copied());
    }

    pub fn snapshot(&self) -> Vec<u8> {
        let (first, second) = self.buffer.as_slices();
        let mut out = Vec::with_capacity(first.len() + second.len());
        out.extend_from_slice(first);
        out.extend_from_slice(second);
        out
    }

    pub fn len(&self) -> usize {
        self.buffer.len()
    }

    pub fn is_empty(&self) -> bool {
        self.buffer.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ring_buffer_capacity() {
        let mut rb = RingBuffer::new(5);
        rb.extend(b"hello");
        assert_eq!(rb.snapshot(), b"hello");

        rb.extend(b"world");
        assert_eq!(rb.snapshot(), b"world");

        rb.extend(b"!");
        assert_eq!(rb.snapshot(), b"orld!");
    }

    #[test]
    fn test_ring_buffer_oversize() {
        let mut rb = RingBuffer::new(4);
        rb.extend(b"0123456789");
        assert_eq!(rb.snapshot(), b"6789");
    }
}
